import base64
import json
import re
import unicodedata
from typing import List, Tuple

import requests
from fastapi import HTTPException, status

from app.core.config import settings
from app.db.supabase import get_supabase
from app.schemas.quiz import GeneratedQuestion, GeneratedQuizResponse, SaveQuizRequest


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
            "Use every attached file for at least one question. After covering every file, allocate the remaining "
            "questions according to how much clear, useful study content each file contains. "
            "Set subject to the matching SPM subject name: Bahasa Melayu, English, Mathematics, Science, History, "
            "Physics, Chemistry, Biology, or Add Mathematics. "
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


class QuizLibraryService:
    """Read real quizzes owned by the signed-in user."""

    SUBJECT_ALIASES = {
        "sejarah": "history",
        "bahasa inggeris": "english",
        "matematik": "mathematics",
        "matematik tambahan": "add mathematics",
        "additional mathematics": "add mathematics",
        "add maths": "add mathematics",
        "sains": "science",
        "fizik": "physics",
        "kimia": "chemistry",
        "biologi": "biology",
        "bahasa malaysia": "bahasa melayu",
        "malay": "bahasa melayu",
    }

    @staticmethod
    def _normalize_subject(value: str) -> str:
        normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
        return re.sub(r"[^a-z0-9]+", " ", normalized.lower()).strip()

    @staticmethod
    def _resolve_subject(supabase, generated_subject: str):
        subject_rows = supabase.table("subjects").select("id,subject_name").execute().data or []
        subjects_by_name = {
            QuizLibraryService._normalize_subject(row["subject_name"]): row
            for row in subject_rows
        }
        generated_key = QuizLibraryService._normalize_subject(generated_subject)
        canonical_key = QuizLibraryService.SUBJECT_ALIASES.get(generated_key, generated_key)

        match = subjects_by_name.get(canonical_key)
        if not match:
            for alias, target in sorted(
                QuizLibraryService.SUBJECT_ALIASES.items(),
                key=lambda item: len(item[0]),
                reverse=True,
            ):
                if alias in generated_key:
                    match = subjects_by_name.get(target)
                    if match:
                        break
        return match

    @staticmethod
    def list_quizzes(user_id: str):
        supabase = get_supabase()
        quiz_response = (
            supabase.table("quizzes")
            .select("id,title,subject_id,source_type,created_at")
            .eq("owner_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        quizzes = quiz_response.data or []

        subject_ids = list({quiz["subject_id"] for quiz in quizzes if quiz.get("subject_id")})
        subject_names = {}
        if subject_ids:
            subject_response = (
                supabase.table("subjects")
                .select("id,subject_name")
                .in_("id", subject_ids)
                .execute()
            )
            subject_names = {
                subject["id"]: subject["subject_name"]
                for subject in (subject_response.data or [])
            }

        return [
            {
                "id": quiz["id"],
                "title": quiz["title"],
                "subject": subject_names.get(quiz.get("subject_id")),
                "source_type": quiz["source_type"],
                "created_at": quiz["created_at"],
            }
            for quiz in quizzes
        ]

    @staticmethod
    def get_quiz(user_id: str, quiz_id: str):
        supabase = get_supabase()
        quiz_response = (
            supabase.table("quizzes")
            .select("id,title,subject_id")
            .eq("id", quiz_id)
            .eq("owner_id", user_id)
            .limit(1)
            .execute()
        )
        if not quiz_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        quiz_row = quiz_response.data[0]

        subject = None
        if quiz_row.get("subject_id"):
            subject_response = (
                supabase.table("subjects")
                .select("subject_name")
                .eq("id", quiz_row["subject_id"])
                .limit(1)
                .execute()
            )
            if subject_response.data:
                subject = subject_response.data[0]["subject_name"]
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This saved quiz has no subject assigned.",
            )

        question_rows = (
            supabase.table("questions")
            .select("id,question_text,question_type,correct_answer,difficulty_level,created_at")
            .eq("quiz_id", quiz_id)
            .order("created_at")
            .execute()
            .data
            or []
        )
        if not question_rows:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This saved quiz has no questions.",
            )

        question_ids = [question["id"] for question in question_rows]
        option_rows = (
            supabase.table("question_options")
            .select("question_id,option_text")
            .in_("question_id", question_ids)
            .execute()
            .data
            or []
        )
        options_by_question = {question_id: [] for question_id in question_ids}
        for option in option_rows:
            options_by_question[option["question_id"]].append(option["option_text"])

        question_type_map = {
            "mcq": "mcq",
            "fill_blank": "fill",
            "short_answer": "short",
        }
        first_type = question_type_map.get(question_rows[0].get("question_type"))
        difficulty = question_rows[0].get("difficulty_level")
        if not first_type or difficulty not in {"Beginner", "Intermediate", "Advanced"}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This saved quiz has incomplete configuration data.",
            )

        return {
            "title": quiz_row["title"],
            "subject": subject,
            "question_type": first_type,
            "difficulty": difficulty,
            "source_files": [],
            "questions": [
                {
                    "question": question["question_text"],
                    "question_type": question_type_map[question["question_type"]],
                    "options": options_by_question[question["id"]],
                    "correct_answer": question["correct_answer"],
                    "explanation": "",
                }
                for question in question_rows
            ],
        }

    @staticmethod
    def delete_quiz(user_id: str, quiz_id: str):
        supabase = get_supabase()
        quiz_response = (
            supabase.table("quizzes")
            .select("id")
            .eq("id", quiz_id)
            .eq("owner_id", user_id)
            .limit(1)
            .execute()
        )
        if not quiz_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        supabase.table("quizzes").delete().eq("id", quiz_id).eq("owner_id", user_id).execute()
        return {"id": quiz_id, "message": "Quiz deleted"}

    @staticmethod
    def record_attempt(user_id: str, quiz_id: str, score: float, total_questions: int, time_taken_seconds: int):
        supabase = get_supabase()
        quiz_response = (
            supabase.table("quizzes")
            .select("id,owner_id")
            .eq("id", quiz_id)
            .limit(1)
            .execute()
        )
        if not quiz_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        quiz_row = quiz_response.data[0]
        if quiz_row["owner_id"] != user_id:
            assignment_response = (
                supabase.table("quiz_assignments")
                .select("id")
                .eq("quiz_id", quiz_id)
                .eq("assigned_to", user_id)
                .limit(1)
                .execute()
            )
            if not assignment_response.data:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz access denied")

        attempt_response = (
            supabase.table("quiz_attempts")
            .insert({
                "student_id": user_id,
                "quiz_id": quiz_id,
                "score": round(score, 2),
                "total_questions": total_questions,
                "time_taken_seconds": time_taken_seconds,
            })
            .execute()
        )
        if not attempt_response.data:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Quiz attempt could not be saved.",
            )
        attempt_id = attempt_response.data[0]["id"]
        prediction = None
        prediction_message = "Quiz attempt saved"
        try:
            # Keep analytics generation server-side so it always runs for a
            # completed attempt, regardless of which client submits it.
            from app.services.analytics import AnalyticsService

            prediction = AnalyticsService.generate_prediction_for_attempt(
                user_id,
                quiz_id,
                attempt_id,
            )
            if prediction:
                prediction_message = "Quiz attempt saved and exam forecast updated"
        except Exception:
            # The attempt is the student's source record and must never be
            # discarded if a secondary forecast calculation is unavailable.
            prediction_message = "Quiz attempt saved; forecast update is temporarily unavailable"

        return {"id": attempt_id, "message": prediction_message, "prediction": prediction}

    @staticmethod
    def save_quiz(user_id: str, quiz: SaveQuizRequest):
        """Persist one generated quiz and its questions/options in Supabase."""
        supabase = get_supabase()
        quiz_id = None

        try:
            matched_subject = QuizLibraryService._resolve_subject(supabase, quiz.subject)
            subject_id = matched_subject["id"] if matched_subject else None

            quiz_response = (
                supabase.table("quizzes")
                .insert({
                    "owner_id": user_id,
                    "subject_id": subject_id,
                    "title": quiz.title.strip(),
                    "source_type": "ai_generated",
                })
                .execute()
            )
            if not quiz_response.data:
                raise RuntimeError("Quiz record was not created")
            quiz_id = quiz_response.data[0]["id"]

            question_type_map = {
                "mcq": "mcq",
                "fill": "fill_blank",
                "short": "short_answer",
            }

            for question in quiz.questions:
                question_response = (
                    supabase.table("questions")
                    .insert({
                        "quiz_id": quiz_id,
                        "question_text": question.question,
                        "question_type": question_type_map[question.question_type],
                        "correct_answer": question.correct_answer,
                        "difficulty_level": quiz.difficulty,
                    })
                    .execute()
                )
                if not question_response.data:
                    raise RuntimeError("Question record was not created")

                if question.question_type == "mcq":
                    question_id = question_response.data[0]["id"]
                    option_rows = [
                        {
                            "question_id": question_id,
                            "option_text": option,
                            "is_correct": option == question.correct_answer,
                        }
                        for option in question.options
                    ]
                    supabase.table("question_options").insert(option_rows).execute()

            # Educator-created quizzes are reusable teaching assets. Put them
            # in the default draft collection so they are immediately
            # available alongside uploaded videos and 3D models.
            profile_rows = (
                supabase.table("profiles").select("role").eq("id", user_id).limit(1).execute().data
                or []
            )
            if profile_rows and profile_rows[0].get("role") == "educator":
                from app.services.collection import CollectionService
                try:
                    CollectionService.add_uploaded_item(user_id, "quiz", quiz_id)
                except Exception:
                    # The quiz itself is the primary user action. A temporary
                    # collection problem must not discard an otherwise valid
                    # educator quiz.
                    pass

            return {"id": quiz_id, "message": "Quiz saved to library"}
        except HTTPException:
            raise
        except Exception as exc:
            if quiz_id:
                try:
                    supabase.table("quizzes").delete().eq("id", quiz_id).eq("owner_id", user_id).execute()
                except Exception:
                    pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to save the quiz to Supabase. Please try again.",
            ) from exc
