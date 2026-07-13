import base64
import json
from typing import List, Tuple

import requests
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.quiz import GeneratedQuestion, GeneratedQuizResponse


class GeminiQuizService:
    """Generate structured student quizzes from uploaded study material."""

    # Flash Lite is reliable for this structured extraction workload. Keep the
    # larger Flash model as a fallback instead of making every request wait on
    # its current high-demand response first.
    MODELS = ("gemini-3.1-flash-lite", "gemini-3.5-flash")
    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    RESPONSE_SCHEMA = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "subject": {"type": "string"},
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "question_type": {
                            "type": "string",
                            "enum": ["mcq", "fill", "short"],
                        },
                        "options": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "correct_answer": {"type": "string"},
                        "explanation": {"type": "string"},
                    },
                    "required": [
                        "question",
                        "question_type",
                        "options",
                        "correct_answer",
                        "explanation",
                    ],
                },
            },
        },
        "required": ["title", "subject", "questions"],
    }

    @staticmethod
    def generate_quiz(
        files: List[Tuple[str, str, bytes]],
        question_type: str,
        difficulty: str,
        question_count: int,
    ) -> GeneratedQuizResponse:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API is not configured.",
            )

        type_instructions = {
            "mcq": "Create multiple-choice questions. Each question must have exactly four options, and correct_answer must exactly match one option.",
            "fill": "Create fill-in-the-blank questions. Use an empty options array and provide the missing text in correct_answer.",
            "short": "Create short-answer questions. Use an empty options array and provide a concise expected answer in correct_answer.",
        }
        prompt = (
            "You are an expert Malaysian SPM tutor. Generate a quiz using only the attached study material. "
            f"Create exactly {question_count} {difficulty.lower()} questions. "
            f"{type_instructions[question_type]} "
            "Keep wording clear for secondary-school students. Give a short teaching explanation for every answer. "
            "Do not invent facts that are absent from the uploaded material."
        )

        parts = [{"text": prompt}]
        for _, mime_type, content in files:
            parts.append(
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64.b64encode(content).decode("ascii"),
                    }
                }
            )

        payload = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "temperature": 0.25,
                "responseMimeType": "application/json",
                "responseSchema": GeminiQuizService.RESPONSE_SCHEMA,
            },
        }

        response = None
        last_connection_error = None
        for model in GeminiQuizService.MODELS:
            try:
                response = requests.post(
                    GeminiQuizService.API_URL.format(model=model),
                    headers={
                        "x-goog-api-key": settings.GEMINI_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=60,
                )
            except requests.RequestException as exc:
                last_connection_error = exc
                continue

            if response.status_code not in {404, 429, 503}:
                break

        if response is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to connect to Gemini. Please try again.",
            ) from last_connection_error

        if not response.ok:
            try:
                provider_message = response.json().get("error", {}).get("message")
            except ValueError:
                provider_message = None
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=provider_message or "Gemini could not generate the quiz.",
            )

        try:
            response_data = response.json()
            candidate = response_data["candidates"][0]
            response_text = "".join(
                part.get("text", "") for part in candidate["content"]["parts"]
            )
            generated_data = json.loads(response_text)
            questions = [GeneratedQuestion.model_validate(item) for item in generated_data["questions"]]
        except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini returned an invalid quiz response. Please try again.",
            ) from exc

        if len(questions) != question_count:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini returned an incomplete quiz. Please try again.",
            )

        return GeneratedQuizResponse(
            title=generated_data["title"],
            subject=generated_data["subject"],
            question_type=question_type,
            difficulty=difficulty,
            source_files=[name for name, _, _ in files],
            questions=questions,
        )
