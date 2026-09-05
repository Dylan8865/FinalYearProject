import base64
import json
import re
import unicodedata
from datetime import date, timedelta
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
    DEFAULT_SUBJECT_NAMES = (
        "Bahasa Melayu",
        "English",
        "Mathematics",
        "Science",
        "History",
        "Physics",
        "Chemistry",
        "Biology",
        "Add Mathematics",
    )

    RESPONSE_SCHEMA = {
        "type": "object",
        "properties": {
            "is_valid_material": {"type": "boolean"},
            "rejection_reason": {"type": "string"},
            "title": {"type": "string"},
            "subject": {"type": "string"},
            "topic": {"type": "string"},
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
        "required": ["is_valid_material", "title", "subject", "topic", "questions"],
    }

    @staticmethod
    def _available_subject_names() -> List[str]:
        try:
            rows = (
                get_supabase().table("subjects")
                .select("subject_name")
                .order("subject_name")
                .execute().data
                or []
            )
            names = [row["subject_name"].strip() for row in rows if row.get("subject_name")]
            if names:
                return names
        except Exception:
            # Quiz generation can still proceed with the standard SPM list if
            # the subject catalogue is temporarily unavailable.
            pass
        return list(GeminiQuizService.DEFAULT_SUBJECT_NAMES)

    @staticmethod
    def generate_quiz(
        files: List[Tuple[str, str, bytes]],
        question_type: str,
        difficulty: str,
        question_count: int,
        focus_topic: str = "",
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
        available_subjects = ", ".join(GeminiQuizService._available_subject_names())
        prompt = (
            "You are an expert Malaysian SPM tutor. First, evaluate the attached material. "
            "If it is blank, nonsensical, or completely unrelated to educational study material, "
            "set 'is_valid_material' to false, provide a brief 'rejection_reason', and leave the other fields empty or generic. "
            "If the material is valid, set 'is_valid_material' to true and generate a quiz using only the attached study material. "
            f"Create exactly {question_count} {difficulty.lower()} questions. "
            f"{type_instructions[question_type]} "
            "Use every attached file for at least one question. After covering every file, allocate the remaining "
            "questions according to how much clear, useful study content each file contains. "
            f"Set subject to exactly one matching name from this current SPM subject list: {available_subjects}. "
            "If the subject is one that lacks an MCQ section in the actual SPM exam (e.g., Chinese, Bahasa Cina, Mandarin, Add Mathematics, Computer Science, Sains Komputer) and the user requests multiple-choice questions (mcq), focus on core vocabulary, definitions, idioms, and foundational concepts that can be tested in an MCQ format. "
            "Set topic to one concise syllabus topic that best describes the attached material. "
            "Keep wording clear for secondary-school students. Give a short teaching explanation for every answer. "
            "Do not invent facts that are absent from the uploaded material."
        )
        if focus_topic:
            prompt += f" Focus the questions specifically on the topic '{focus_topic}', using other material only when needed for context."

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
            
            if not generated_data.get("is_valid_material", True):
                reason = generated_data.get("rejection_reason") or "The uploaded material does not contain valid educational content."
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

            questions = [GeneratedQuestion.model_validate(item) for item in generated_data["questions"]]
        except HTTPException:
            raise
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

        try:
            return GeneratedQuizResponse(
                title=generated_data["title"],
                subject=generated_data["subject"],
                topic=generated_data["topic"],
                question_type=question_type,
                difficulty=difficulty,
                source_files=[name for name, _, _ in files],
                questions=questions,
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini returned incomplete quiz metadata. Please try again.",
            ) from exc


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
        "geografi": "geography",
        "sains komputer": "computer science",
        "informatik": "computer science",
        "ekonomi": "economic",
        "economics": "economic",
        "bahasa cina": "chinese",
        "bahasa mandarin": "chinese",
        "chinese language": "chinese",
        "mandarin": "chinese",
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
        return QuizLibraryService._match_subject(subject_rows, generated_subject)

    @staticmethod
    def _match_subject(subject_rows: List[dict], generated_subject: str):
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
        if not match:
            # Accept descriptive model output such as "SPM Geography" while
            # preferring the longest subject name (Computer Science before Science).
            for subject_key in sorted(subjects_by_name, key=len, reverse=True):
                if subject_key in generated_key or generated_key in subject_key:
                    match = subjects_by_name[subject_key]
                    break
        return match

    @staticmethod
    def _resolve_or_create_topic(supabase, subject_id: str, topic_name: str, difficulty_level: str = None):
        cleaned_name = " ".join(topic_name.split()).strip()
        topic_rows = (
            supabase.table("topics")
            .select("id,topic_name,difficulty_level")
            .eq("subject_id", subject_id)
            .execute()
            .data
            or []
        )
        normalized = cleaned_name.casefold()
        existing = next((row for row in topic_rows if row["topic_name"].casefold() == normalized), None)
        if existing:
            if difficulty_level and not existing.get("difficulty_level"):
                supabase.table("topics").update({"difficulty_level": difficulty_level}).eq("id", existing["id"]).execute()
            return existing
        
        insert_data = {
            "subject_id": subject_id,
            "topic_name": cleaned_name,
        }
        if difficulty_level:
            insert_data["difficulty_level"] = difficulty_level
            
        response = supabase.table("topics").insert(insert_data).execute()
        if not response.data:
            raise RuntimeError("Quiz topic was not created")
        return response.data[0]

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

        assigned_response = (
            supabase.table("quiz_assignments")
            .select("quiz_id,assigned_by")
            .eq("assigned_to", user_id)
            .execute()
        )
        assignments = assigned_response.data or []
        assigned_quiz_ids = {
            row["quiz_id"] for row in assignments if row.get("quiz_id")
        }
        assigned_by_ids = list({row["assigned_by"] for row in assignments if row.get("assigned_by")})
        educator_names = {}
        if assigned_by_ids:
            educator_response = (
                supabase.table("profiles")
                .select("id,full_name,username")
                .in_("id", assigned_by_ids)
                .execute()
            )
            educator_names = {
                row["id"]: row.get("full_name") or row.get("username") or "Educator"
                for row in (educator_response.data or [])
            }
        assigned_by_for_quiz = {
            row["quiz_id"]: educator_names.get(row.get("assigned_by"))
            for row in assignments
            if row.get("quiz_id")
        }
        owned_quiz_ids = {quiz["id"] for quiz in quizzes}
        additional_quiz_ids = assigned_quiz_ids - owned_quiz_ids
        if additional_quiz_ids:
            assigned_quiz_response = (
                supabase.table("quizzes")
                .select("id,title,subject_id,source_type,created_at")
                .in_("id", list(additional_quiz_ids))
                .execute()
            )
            quizzes.extend(assigned_quiz_response.data or [])

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

        quiz_ids = [quiz["id"] for quiz in quizzes]
        in_progress_quizzes = set()
        if quiz_ids:
            progress_response = (
                supabase.table("quiz_progress")
                .select("quiz_id")
                .in_("quiz_id", quiz_ids)
                .eq("student_id", user_id)
                .execute()
            )
            in_progress_quizzes = {row["quiz_id"] for row in (progress_response.data or [])}

        return [
            {
                "id": quiz["id"],
                "title": quiz["title"],
                "subject": subject_names.get(quiz.get("subject_id")),
                "source_type": "educator_assigned" if quiz["id"] in assigned_quiz_ids else quiz["source_type"],
                "created_at": quiz["created_at"],
                "has_in_progress_attempt": quiz["id"] in in_progress_quizzes,
                "assigned_by_name": assigned_by_for_quiz.get(quiz["id"]),
            }
            for quiz in quizzes
        ]

    @staticmethod
    def get_quiz(user_id: str, quiz_id: str):
        supabase = get_supabase()
        quiz_response = (
            supabase.table("quizzes")
            .select("id,title,subject_id,topic_id,owner_id")
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

        topic = "General practice"
        if quiz_row.get("topic_id"):
            topic_response = (
                supabase.table("topics")
                .select("topic_name")
                .eq("id", quiz_row["topic_id"])
                .limit(1)
                .execute()
            )
            if topic_response.data:
                topic = topic_response.data[0]["topic_name"]

        question_rows = (
            supabase.table("questions")
            .select("id,question_text,question_type,correct_answer,explanation,difficulty_level,created_at")
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
            "topic": topic,
            "question_type": first_type,
            "difficulty": difficulty,
            "source_files": [],
            "questions": [
                {
                    "id": question["id"],
                    "question": question["question_text"],
                    "question_type": question_type_map[question["question_type"]],
                    "options": options_by_question[question["id"]],
                    "correct_answer": question["correct_answer"],
                    "explanation": question.get("explanation") or "",
                }
                for question in question_rows
            ],
        }

    @staticmethod
    def delete_quiz(user_id: str, quiz_id: str):
        supabase = get_supabase()
        quiz_response = (
            supabase.table("quizzes")
            .select("id, topic_id")
            .eq("id", quiz_id)
            .eq("owner_id", user_id)
            .limit(1)
            .execute()
        )
        if not quiz_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        topic_id = quiz_response.data[0].get("topic_id")

        supabase.table("quizzes").delete().eq("id", quiz_id).eq("owner_id", user_id).execute()

        # Clean up topic analytics if this was the only quiz using it
        if topic_id:
            other_quizzes = (
                supabase.table("quizzes")
                .select("id")
                .eq("topic_id", topic_id)
                .eq("owner_id", user_id)
                .limit(1)
                .execute()
            )
            if not other_quizzes.data:
                supabase.table("performance_records").delete().eq("topic_id", topic_id).eq("student_id", user_id).execute()
                supabase.table("spaced_repetition_schedule").delete().eq("topic_id", topic_id).eq("student_id", user_id).execute()

        return {"id": quiz_id, "message": "Quiz deleted"}

    @staticmethod
    def assign_quiz(educator_id: str, quiz_id: str, student_id: str):
        supabase = get_supabase()
        
        # Verify educator owns the quiz
        quiz_response = (
            supabase.table("quizzes")
            .select("id")
            .eq("id", quiz_id)
            .eq("owner_id", educator_id)
            .limit(1)
            .execute()
        )
        if not quiz_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found or not owned by you.")

        # Verify student exists and has student role
        student_response = (
            supabase.table("profiles")
            .select("id")
            .eq("id", student_id)
            .eq("role", "student")
            .limit(1)
            .execute()
        )
        if not student_response.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid student.")

        # Check if already assigned
        assignment_check = (
            supabase.table("quiz_assignments")
            .select("id")
            .eq("quiz_id", quiz_id)
            .eq("assigned_to", student_id)
            .limit(1)
            .execute()
        )
        if assignment_check.data:
            return {"id": quiz_id, "message": "Quiz already assigned to this student."}

        # Insert assignment
        supabase.table("quiz_assignments").insert({
            "quiz_id": quiz_id,
            "assigned_to": student_id,
            "assigned_by": educator_id,
        }).execute()
        
        return {"id": quiz_id, "message": "Quiz successfully assigned."}

    @staticmethod
    def get_quiz_progress(user_id: str, quiz_id: str):
        supabase = get_supabase()
        response = (
            supabase.table("quiz_progress")
            .select("current_index,elapsed_seconds,answers,answer_times")
            .eq("student_id", user_id)
            .eq("quiz_id", quiz_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    @staticmethod
    def save_quiz_progress(user_id: str, quiz_id: str, progress_data: dict):
        supabase = get_supabase()
        # Verify quiz exists
        quiz_check = supabase.table("quizzes").select("id").eq("id", quiz_id).limit(1).execute()
        if not quiz_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

        payload = {
            "student_id": user_id,
            "quiz_id": quiz_id,
            "current_index": progress_data.get("current_index", 0),
            "elapsed_seconds": progress_data.get("elapsed_seconds", 0),
            "answers": progress_data.get("answers", {}),
            "answer_times": progress_data.get("answer_times", {}),
        }

        existing = (
            supabase.table("quiz_progress")
            .select("id")
            .eq("student_id", user_id)
            .eq("quiz_id", quiz_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            supabase.table("quiz_progress").update(payload).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("quiz_progress").insert(payload).execute()

    @staticmethod
    def delete_quiz_progress(user_id: str, quiz_id: str):
        supabase = get_supabase()
        supabase.table("quiz_progress").delete().eq("student_id", user_id).eq("quiz_id", quiz_id).execute()
        return {"id": quiz_id, "message": "Quiz progress deleted"}

    @staticmethod
    def record_attempt(user_id: str, quiz_id: str, score: float, total_questions: int, time_taken_seconds: int, answers):
        supabase = get_supabase()
        quiz_response = (
            supabase.table("quizzes")
            .select("id,owner_id,subject_id,topic_id")
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

        question_rows = (
            supabase.table("questions")
            .select("id,correct_answer,created_at")
            .eq("quiz_id", quiz_id)
            .order("created_at")
            .execute()
            .data
            or []
        )
        if not question_rows or total_questions != len(question_rows):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Quiz questions changed before this attempt could be saved.",
            )

        answer_by_index = {answer.question_index: answer for answer in answers}
        correct_count = 0
        answer_rows = []
        for index, question in enumerate(question_rows):
            submitted = answer_by_index.get(index)
            selected_answer = submitted.selected_answer.strip() if submitted and submitted.selected_answer else None
            expected = (question.get("correct_answer") or "").strip().casefold()
            is_correct = bool(selected_answer) and selected_answer.casefold() == expected
            if is_correct:
                correct_count += 1
            answer_rows.append({
                "question_id": question["id"],
                "selected_answer": selected_answer,
                "is_correct": is_correct,
                "time_spent_seconds": submitted.time_spent_seconds if submitted else 0,
            })

        calculated_score = round((correct_count / len(question_rows)) * 100, 2)

        attempt_response = (
            supabase.table("quiz_attempts")
            .insert({
                "student_id": user_id,
                "quiz_id": quiz_id,
                # Recompute correctness on the server instead of trusting the
                # aggregate score sent by the browser.
                "score": calculated_score,
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
        try:
            for row in answer_rows:
                row["attempt_id"] = attempt_id
            answer_response = supabase.table("attempt_answers").insert(answer_rows).execute()
            if len(answer_response.data or []) != len(answer_rows):
                raise RuntimeError("Not every answer was stored")
        except Exception as exc:
            try:
                supabase.table("quiz_attempts").delete().eq("id", attempt_id).eq("student_id", user_id).execute()
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Per-question answers could not be saved. Please try again.",
            ) from exc

        prediction = None
        review_schedule = None
        prediction_message = "Quiz attempt and per-question answers saved"
        try:
            review_schedule = QuizLibraryService._update_topic_learning_records(
                supabase,
                user_id,
                quiz_row,
                calculated_score,
            )
        except Exception:
            prediction_message = "Answers saved; topic analytics are temporarily unavailable"

        try:
            # Keep analytics generation server-side so it always runs for a
            # completed attempt, regardless of which client submits it.
            from app.services.analytics import AnalyticsService

            prediction = AnalyticsService.generate_prediction_for_attempt(
                user_id,
                quiz_id,
                attempt_id,
            )
            if prediction and review_schedule:
                prediction_message = "Answers saved; topic mastery, review date, and exam forecast updated"
        except Exception:
            # The attempt is the student's source record and must never be
            # discarded if a secondary forecast calculation is unavailable.
            prediction_message = "Answers saved; some analytics updates are temporarily unavailable"

        return {
            "id": attempt_id,
            "message": prediction_message,
            "prediction": prediction,
            "review_schedule": review_schedule,
        }

    @staticmethod
    def _update_topic_learning_records(supabase, user_id: str, quiz_row: dict, score: float):
        topic_id = quiz_row.get("topic_id")
        if not topic_id:
            return None

        performance_rows = (
            supabase.table("performance_records")
            .select("id,score_percentage,sessions_count")
            .eq("student_id", user_id)
            .eq("topic_id", topic_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if performance_rows:
            record = performance_rows[0]
            count = int(record.get("sessions_count") or 0)
            average = ((float(record.get("score_percentage") or 0) * count) + score) / (count + 1)
            supabase.table("performance_records").update({
                "score_percentage": round(average, 2),
                "sessions_count": count + 1,
                "last_updated": date.today().isoformat(),
            }).eq("id", record["id"]).eq("student_id", user_id).execute()
        else:
            supabase.table("performance_records").insert({
                "student_id": user_id,
                "topic_id": topic_id,
                "score_percentage": score,
                "sessions_count": 1,
            }).execute()

        schedule_rows = (
            supabase.table("spaced_repetition_schedule")
            .select("id,ease_factor,interval_days,repetitions")
            .eq("student_id", user_id)
            .eq("topic_id", topic_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        current = schedule_rows[0] if schedule_rows else None
        old_ease = float(current.get("ease_factor") or 2.5) if current else 2.5
        old_interval = int(current.get("interval_days") or 1) if current else 1
        old_repetitions = int(current.get("repetitions") or 0) if current else 0
        today = date.today()
        values = QuizLibraryService._calculate_review_schedule(
            score,
            old_ease,
            old_interval,
            old_repetitions,
            today,
        )
        values.update({
            "last_reviewed_date": today.isoformat(),
            "last_score": score,
        })
        if current:
            response = supabase.table("spaced_repetition_schedule").update(values).eq("id", current["id"]).eq("student_id", user_id).execute()
        else:
            response = supabase.table("spaced_repetition_schedule").insert({
                **values,
                "student_id": user_id,
                "topic_id": topic_id,
            }).execute()
        if not response.data:
            raise RuntimeError("Review schedule was not updated")
        return response.data[0]

    @staticmethod
    def _calculate_review_schedule(score: float, old_ease: float, old_interval: int, old_repetitions: int, today: date):
        quality = 5 if score >= 90 else 4 if score >= 75 else 3 if score >= 60 else 2 if score >= 40 else 1
        if quality < 3:
            repetitions = 0
            interval_days = 1
        else:
            repetitions = old_repetitions + 1
            interval_days = 1 if repetitions == 1 else 6 if repetitions == 2 else max(1, round(old_interval * old_ease))
        ease_factor = max(1.3, old_ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
        return {
            "ease_factor": round(ease_factor, 2),
            "interval_days": interval_days,
            "repetitions": repetitions,
            "next_review_date": (today + timedelta(days=interval_days)).isoformat(),
        }

    @staticmethod
    def save_quiz(user_id: str, quiz: SaveQuizRequest):
        """Persist one generated quiz and its questions/options in Supabase."""
        supabase = get_supabase()
        quiz_id = None

        try:
            matched_subject = QuizLibraryService._resolve_subject(supabase, quiz.subject)
            subject_id = matched_subject["id"] if matched_subject else None
            if not subject_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Generated quiz subject '{quiz.subject}' could not be matched to an SPM subject.",
                )
            topic = QuizLibraryService._resolve_or_create_topic(supabase, subject_id, quiz.topic, getattr(quiz, 'difficulty', None))

            quiz_response = (
                supabase.table("quizzes")
                .insert({
                    "owner_id": user_id,
                    "subject_id": subject_id,
                    "topic_id": topic["id"],
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
                        "explanation": question.explanation,
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
