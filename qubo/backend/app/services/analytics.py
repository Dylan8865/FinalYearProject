from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
import re
from typing import Dict, List, Optional

from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.schemas.analytics import StudySessionCreate


class AnalyticsService:
    """Build learning analytics exclusively from persisted Supabase records."""

    DEFAULT_ALERT_THRESHOLD = 50.0

    @staticmethod
    def _parse_datetime(value: str) -> datetime:
        normalized = value.strip().replace("Z", "+00:00")
        # Python 3.8 accepts either three or six fractional-second digits,
        # while Postgres may return any precision from one to six digits.
        normalized = re.sub(
            r"\.(\d+)(?=([+-]\d{2}:\d{2})?$)",
            lambda match: f".{match.group(1)[:6].ljust(6, '0')}",
            normalized,
        )
        return datetime.fromisoformat(normalized)

    @staticmethod
    def _calculate_learning_velocity(attempts: List[dict]) -> Optional[float]:
        """Return score improvement in percentage points per week."""
        if len(attempts) < 2:
            return None

        first = attempts[0]
        last = attempts[-1]
        elapsed_days = max(
            (AnalyticsService._parse_datetime(last["attempted_at"]) - AnalyticsService._parse_datetime(first["attempted_at"])).total_seconds() / 86400,
            1,
        )
        weeks = max(elapsed_days / 7, 1)
        return round((float(last["score"]) - float(first["score"])) / weeks, 1)

    @staticmethod
    def _calculate_prediction(scores: List[float], study_minutes_14_days: int) -> float:
        """Forecast from recency-weighted scores, recent trend, and study consistency."""
        if not scores:
            raise ValueError("At least one quiz score is required")

        recent_scores = scores[-10:]
        weights = list(range(1, len(recent_scores) + 1))
        weighted_average = sum(score * weight for score, weight in zip(recent_scores, weights)) / sum(weights)

        trend_adjustment = 0.0
        if len(recent_scores) >= 2:
            per_attempt_change = (recent_scores[-1] - recent_scores[0]) / (len(recent_scores) - 1)
            trend_adjustment = max(-8.0, min(8.0, per_attempt_change * 1.5))

        study_adjustment = min(4.0, max(0, study_minutes_14_days) / 75.0)
        return round(max(0.0, min(100.0, weighted_average + trend_adjustment + study_adjustment)), 1)

    @staticmethod
    def get_prediction_settings(student_id: str):
        supabase = get_supabase()
        response = (
            supabase.table("profiles")
            .select("prediction_alert_threshold")
            .eq("id", student_id)
            .single()
            .execute()
        )
        value = (response.data or {}).get("prediction_alert_threshold")
        return {"threshold": float(value if value is not None else AnalyticsService.DEFAULT_ALERT_THRESHOLD)}

    @staticmethod
    def update_prediction_settings(student_id: str, threshold: float):
        supabase = get_supabase()
        response = (
            supabase.table("profiles")
            .update({"prediction_alert_threshold": round(threshold, 2)})
            .eq("id", student_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
        return {"threshold": float(response.data[0]["prediction_alert_threshold"])}

    @staticmethod
    def generate_prediction_for_attempt(student_id: str, quiz_id: str, attempt_id: str):
        """Generate and persist one forecast immediately after a completed quiz."""
        supabase = get_supabase()
        quiz_rows = (
            supabase.table("quizzes")
            .select("subject_id")
            .eq("id", quiz_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not quiz_rows or not quiz_rows[0].get("subject_id"):
            return None
        subject_id = quiz_rows[0]["subject_id"]

        subject_quizzes = (
            supabase.table("quizzes")
            .select("id")
            .eq("subject_id", subject_id)
            .execute()
            .data
            or []
        )
        quiz_ids = [row["id"] for row in subject_quizzes]
        attempts = (
            supabase.table("quiz_attempts")
            .select("score,attempted_at")
            .eq("student_id", student_id)
            .in_("quiz_id", quiz_ids)
            .order("attempted_at")
            .execute()
            .data
            or []
        )
        scores = [float(row["score"]) for row in attempts if row.get("score") is not None]
        if not scores:
            return None

        cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
        recent_sessions = (
            supabase.table("study_sessions")
            .select("duration_minutes")
            .eq("student_id", student_id)
            .eq("subject_id", subject_id)
            .gte("session_date", cutoff)
            .execute()
            .data
            or []
        )
        study_minutes = sum(row.get("duration_minutes") or 0 for row in recent_sessions)
        
        from app.services.ml_prediction import MLPredictionService
        predicted_score = MLPredictionService.train_and_predict(study_minutes, scores)
        threshold = AnalyticsService.get_prediction_settings(student_id)["threshold"]
        risk_level = "high" if predicted_score < threshold else "medium" if predicted_score < threshold + 10 else "low"

        prediction_response = (
            supabase.table("exam_predictions")
            .insert({
                "student_id": student_id,
                "subject_id": subject_id,
                "quiz_attempt_id": attempt_id,
                "predicted_score": predicted_score,
                "risk_level": risk_level,
                "alert_threshold": threshold,
                "is_warning": predicted_score < threshold,
                "basis_attempt_count": len(scores),
                "model_version": "random-forest-v1",
            })
            .execute()
        )
        if not prediction_response.data:
            raise RuntimeError("Prediction record was not created")

        subject_row = (
            supabase.table("subjects")
            .select("subject_name")
            .eq("id", subject_id)
            .single()
            .execute()
            .data
        )
        row = prediction_response.data[0]
        return AnalyticsService._format_prediction(row, (subject_row or {}).get("subject_name", "Subject"))

    @staticmethod
    def _format_prediction(row: dict, subject_name: str):
        threshold = float(row.get("alert_threshold") or AnalyticsService.DEFAULT_ALERT_THRESHOLD)
        predicted_score = float(row["predicted_score"])
        return {
            "id": row["id"],
            "subject_id": row["subject_id"],
            "subject_name": subject_name,
            "predicted_score": predicted_score,
            "risk_level": row["risk_level"],
            "threshold": threshold,
            "is_warning": bool(row.get("is_warning", predicted_score < threshold)),
            "basis_attempt_count": int(row.get("basis_attempt_count") or 1),
            "generated_at": row["generated_at"],
        }

    @staticmethod
    def create_study_session(student_id: str, payload: StudySessionCreate):
        supabase = get_supabase()
        selected = (
            supabase.table("student_subjects")
            .select("id")
            .eq("student_id", student_id)
            .eq("subject_id", payload.subject_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not selected:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Select this subject in Profile Settings before recording a session.",
            )

        subject_rows = (
            supabase.table("subjects")
            .select("subject_name")
            .eq("id", payload.subject_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not subject_rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

        topic_rows = (
            supabase.table("topics")
            .select("id,topic_name")
            .eq("subject_id", payload.subject_id)
            .execute()
            .data
            or []
        )
        normalized_topic = payload.topic_name.casefold()
        topic = next((row for row in topic_rows if row["topic_name"].casefold() == normalized_topic), None)
        if not topic:
            topic_response = (
                supabase.table("topics")
                .insert({"subject_id": payload.subject_id, "topic_name": payload.topic_name})
                .execute()
            )
            if not topic_response.data:
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Topic could not be saved")
            topic = topic_response.data[0]

        session_id = None
        try:
            session_response = (
                supabase.table("study_sessions")
                .insert({
                    "student_id": student_id,
                    "subject_id": payload.subject_id,
                    "duration_minutes": payload.duration_minutes,
                    "pomodoro_cycles": payload.pomodoro_cycles,
                    "session_date": (payload.session_date or datetime.now(timezone.utc)).isoformat(),
                    "notes": payload.notes.strip() if payload.notes and payload.notes.strip() else None,
                })
                .execute()
            )
            if not session_response.data:
                raise RuntimeError("Study session was not created")
            session = session_response.data[0]
            session_id = session["id"]
            supabase.table("session_topics").insert({
                "session_id": session_id,
                "topic_id": topic["id"],
                "time_spent_minutes": payload.duration_minutes,
            }).execute()
            return {
                **session,
                "subject_name": subject_rows[0]["subject_name"],
                "topic_id": topic["id"],
                "topic_name": topic["topic_name"],
            }
        except HTTPException:
            raise
        except Exception as exc:
            if session_id:
                try:
                    supabase.table("study_sessions").delete().eq("id", session_id).eq("student_id", student_id).execute()
                except Exception:
                    pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Study session could not be saved. Please try again.",
            ) from exc

    @staticmethod
    def list_study_sessions(student_id: str, limit: int = 10):
        supabase = get_supabase()
        sessions = (
            supabase.table("study_sessions")
            .select("id,subject_id,duration_minutes,pomodoro_cycles,session_date,notes")
            .eq("student_id", student_id)
            .order("session_date", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )
        if not sessions:
            return []

        subject_ids = list({row["subject_id"] for row in sessions})
        subjects = (
            supabase.table("subjects").select("id,subject_name").in_("id", subject_ids).execute().data or []
        )
        subject_names = {row["id"]: row["subject_name"] for row in subjects}

        session_ids = [row["id"] for row in sessions]
        session_topics = (
            supabase.table("session_topics")
            .select("session_id,topic_id")
            .in_("session_id", session_ids)
            .execute()
            .data
            or []
        )
        topic_ids = list({row["topic_id"] for row in session_topics})
        topics = supabase.table("topics").select("id,topic_name").in_("id", topic_ids).execute().data if topic_ids else []
        topic_names = {row["id"]: row["topic_name"] for row in (topics or [])}
        topic_by_session = {row["session_id"]: row["topic_id"] for row in session_topics}

        return [{
            **session,
            "subject_name": subject_names.get(session["subject_id"], "Subject"),
            "topic_id": topic_by_session.get(session["id"], ""),
            "topic_name": topic_names.get(topic_by_session.get(session["id"]), "General study"),
        } for session in sessions]

    @staticmethod
    def list_review_schedule(student_id: str, due_only: bool = False):
        supabase = get_supabase()
        query = (
            supabase.table("spaced_repetition_schedule")
            .select("id,topic_id,ease_factor,interval_days,repetitions,next_review_date,last_reviewed_date,last_score")
            .eq("student_id", student_id)
            .order("next_review_date")
        )
        if due_only:
            query = query.lte("next_review_date", date.today().isoformat())
        schedules = query.execute().data or []
        if not schedules:
            return []

        topic_ids = [row["topic_id"] for row in schedules]
        topics = (
            supabase.table("topics")
            .select("id,topic_name,subject_id")
            .in_("id", topic_ids)
            .execute().data or []
        )
        topic_by_id = {row["id"]: row for row in topics}
        subject_ids = list({row["subject_id"] for row in topics})
        subjects = (
            supabase.table("subjects")
            .select("id,subject_name")
            .in_("id", subject_ids)
            .execute().data or []
        ) if subject_ids else []
        subject_names = {row["id"]: row["subject_name"] for row in subjects}

        quiz_rows = (
            supabase.table("quizzes")
            .select("id,owner_id,topic_id,created_at")
            .in_("topic_id", topic_ids)
            .order("created_at", desc=True)
            .execute().data or []
        )
        quiz_ids = [row["id"] for row in quiz_rows]
        assigned_quiz_ids = set()
        if quiz_ids:
            assignments = (
                supabase.table("quiz_assignments")
                .select("quiz_id")
                .eq("assigned_to", student_id)
                .in_("quiz_id", quiz_ids)
                .execute().data or []
            )
            assigned_quiz_ids = {row["quiz_id"] for row in assignments}

        quiz_by_topic = {}
        for quiz in quiz_rows:
            if quiz["owner_id"] == student_id or quiz["id"] in assigned_quiz_ids:
                quiz_by_topic.setdefault(quiz["topic_id"], quiz["id"])

        today = date.today().isoformat()
        result = []
        for schedule in schedules:
            topic = topic_by_id.get(schedule["topic_id"])
            if not topic:
                continue
            result.append({
                **schedule,
                "ease_factor": float(schedule["ease_factor"]),
                "last_score": float(schedule["last_score"]) if schedule.get("last_score") is not None else None,
                "subject_id": topic["subject_id"],
                "subject_name": subject_names.get(topic["subject_id"], "Subject"),
                "topic_name": topic["topic_name"],
                "is_due": schedule["next_review_date"] <= today,
                "quiz_id": quiz_by_topic.get(schedule["topic_id"]),
            })
        return result

    @staticmethod
    def export_progress_report(
        student_id: str,
        language: str = "en",
        subject_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ):
        from app.services.report import ProgressReportService

        supabase = get_supabase()
        profile = (
            supabase.table("profiles")
            .select("username,full_name,school,form_level,target_grade")
            .eq("id", student_id)
            .single()
            .execute().data
        )
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
        subjects = AnalyticsService.get_subject_analytics(
            student_id,
            subject_id,
            topic_id,
            date_from,
            date_to,
        )
        sessions = AnalyticsService.list_study_sessions(student_id, 50)
        if subject_id:
            sessions = [item for item in sessions if item["subject_id"] == subject_id]
        if topic_id:
            sessions = [item for item in sessions if item["topic_id"] == topic_id]
        if date_from:
            sessions = [item for item in sessions if AnalyticsService._parse_datetime(item["session_date"]).date() >= date_from]
        if date_to:
            sessions = [item for item in sessions if AnalyticsService._parse_datetime(item["session_date"]).date() <= date_to]
        schedule = AnalyticsService.list_review_schedule(student_id)
        if subject_id:
            schedule = [item for item in schedule if item["subject_id"] == subject_id]
        if topic_id:
            schedule = [item for item in schedule if item["topic_id"] == topic_id]

        now = datetime.now(timezone.utc).astimezone()
        return ProgressReportService.render(
            profile,
            subjects,
            sessions,
            schedule,
            language,
            now.strftime("%d %B %Y, %H:%M"),
        )

    @staticmethod
    def get_subject_analytics(
        student_id: str,
        subject_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ):
        if date_from and date_to and date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="From date must be on or before to date.",
            )
        supabase = get_supabase()

        selected_rows = (
            supabase.table("student_subjects").select("subject_id").eq("student_id", student_id).execute().data or []
        )
        subject_ids = [row["subject_id"] for row in selected_rows]
        if subject_id:
            subject_ids = [value for value in subject_ids if value == subject_id]
        if not subject_ids:
            return []

        subject_rows = (
            supabase.table("subjects").select("id,subject_name,category").in_("id", subject_ids).order("subject_name").execute().data or []
        )
        subject_names = {row["id"]: row["subject_name"] for row in subject_rows}
        topic_query = supabase.table("topics").select("id,subject_id,topic_name,difficulty_level").in_("subject_id", subject_ids)
        if topic_id:
            topic_query = topic_query.eq("id", topic_id)
        topic_rows = topic_query.order("topic_name").execute().data or []
        topic_ids = [topic["id"] for topic in topic_rows]

        performance_rows = []
        if topic_ids:
            performance_rows = (
                supabase.table("performance_records")
                .select("topic_id,score_percentage,sessions_count,last_updated")
                .eq("student_id", student_id)
                .in_("topic_id", topic_ids)
                .execute().data or []
            )

        session_query = (
            supabase.table("study_sessions")
            .select("id,subject_id,duration_minutes,session_date")
            .eq("student_id", student_id)
            .in_("subject_id", subject_ids)
        )
        if date_from:
            session_query = session_query.gte("session_date", datetime.combine(date_from, datetime.min.time(), tzinfo=timezone.utc).isoformat())
        if date_to:
            session_query = session_query.lte("session_date", datetime.combine(date_to, datetime.max.time(), tzinfo=timezone.utc).isoformat())
        session_rows = session_query.execute().data or []
        session_ids = [row["id"] for row in session_rows]
        session_topic_rows = (
            supabase.table("session_topics").select("session_id,topic_id").in_("session_id", session_ids).execute().data or []
        ) if session_ids else []
        if topic_id:
            matching_session_ids = {
                row["session_id"] for row in session_topic_rows if row["topic_id"] == topic_id
            }
            session_rows = [row for row in session_rows if row["id"] in matching_session_ids]
            session_topic_rows = [row for row in session_topic_rows if row["topic_id"] == topic_id]

        attempt_query = (
            supabase.table("quiz_attempts")
            .select("quiz_id,score,attempted_at")
            .eq("student_id", student_id)
        )
        if date_from:
            attempt_query = attempt_query.gte("attempted_at", datetime.combine(date_from, datetime.min.time(), tzinfo=timezone.utc).isoformat())
        if date_to:
            attempt_query = attempt_query.lte("attempted_at", datetime.combine(date_to, datetime.max.time(), tzinfo=timezone.utc).isoformat())
        attempt_rows = attempt_query.order("attempted_at").execute().data or []
        attempted_quiz_ids = list({row["quiz_id"] for row in attempt_rows})
        quiz_subjects: Dict[str, str] = {}
        if attempted_quiz_ids:
            quiz_rows = supabase.table("quizzes").select("id,subject_id,topic_id").in_("id", attempted_quiz_ids).execute().data or []
            quiz_subjects = {
                row["id"]: row.get("subject_id")
                for row in quiz_rows
                if not topic_id or row.get("topic_id") == topic_id
            }

        prediction_rows = (
            supabase.table("exam_predictions")
            .select("id,subject_id,predicted_score,risk_level,alert_threshold,is_warning,basis_attempt_count,generated_at")
            .eq("student_id", student_id)
            .in_("subject_id", subject_ids)
            .order("generated_at", desc=True)
            .execute().data or []
        )
        latest_prediction_by_subject = {}
        for prediction in prediction_rows:
            latest_prediction_by_subject.setdefault(prediction["subject_id"], prediction)

        topics_by_subject = defaultdict(list)
        for topic in topic_rows:
            topics_by_subject[topic["subject_id"]].append(topic)
        performance_by_topic = {row["topic_id"]: row for row in performance_rows}

        minutes_by_subject = defaultdict(int)
        sessions_by_subject = defaultdict(int)
        for session in session_rows:
            minutes_by_subject[session["subject_id"]] += session.get("duration_minutes") or 0
            sessions_by_subject[session["subject_id"]] += 1
        topic_session_counts = defaultdict(int)
        for session_topic in session_topic_rows:
            topic_session_counts[session_topic["topic_id"]] += 1

        attempts_by_subject = defaultdict(list)
        for attempt in attempt_rows:
            subject_id = quiz_subjects.get(attempt["quiz_id"])
            if subject_id and attempt.get("score") is not None:
                attempts_by_subject[subject_id].append(attempt)

        result = []
        for subject in subject_rows:
            subject_topics = topics_by_subject[subject["id"]]
            topic_performance = []
            measured_scores = []
            for topic in subject_topics:
                performance = performance_by_topic.get(topic["id"])
                score = float(performance["score_percentage"]) if performance else None
                if score is not None:
                    measured_scores.append(score)
                topic_performance.append({
                    "topic_id": topic["id"],
                    "topic_name": topic["topic_name"],
                    "difficulty_level": topic.get("difficulty_level"),
                    "score_percentage": score,
                    "sessions_count": topic_session_counts[topic["id"]],
                    "last_updated": performance.get("last_updated") if performance else None,
                })

            subject_attempts = attempts_by_subject[subject["id"]]
            mastery_scores = measured_scores or [float(attempt["score"]) for attempt in subject_attempts]
            latest_prediction = latest_prediction_by_subject.get(subject["id"])
            result.append({
                "id": subject["id"],
                "subject_name": subject["subject_name"],
                "category": subject.get("category"),
                "overall_mastery": round(sum(mastery_scores) / len(mastery_scores), 1) if mastery_scores else None,
                "topics_total": len(subject_topics),
                "topics_measured": len(measured_scores),
                "study_minutes": minutes_by_subject[subject["id"]],
                "study_sessions": sessions_by_subject[subject["id"]],
                "quizzes_completed": len(subject_attempts),
                "learning_velocity": AnalyticsService._calculate_learning_velocity(subject_attempts),
                "topic_performance": topic_performance,
                "recent_quiz_scores": [{"score": float(attempt["score"]), "attempted_at": attempt["attempted_at"]} for attempt in subject_attempts[-12:]],
                "latest_prediction": AnalyticsService._format_prediction(latest_prediction, subject_names[subject["id"]]) if latest_prediction else None,
            })
        return result

    @staticmethod
    def link_student(educator_id: str, username: str):
        supabase = get_supabase()
        students = (
            supabase.table("profiles")
            .select("id,username,role")
            .ilike("username", username)
            .limit(1)
            .execute().data or []
        )
        if not students or students[0].get("role") != "student":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student username not found")
        student_id = students[0]["id"]
        existing = (
            supabase.table("educator_students")
            .select("id")
            .eq("educator_id", educator_id)
            .eq("student_id", student_id)
            .limit(1)
            .execute().data or []
        )
        if existing:
            return {"id": existing[0]["id"], "message": "Student is already in your class"}
        response = supabase.table("educator_students").insert({"educator_id": educator_id, "student_id": student_id}).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Student could not be linked")
        return {"id": response.data[0]["id"], "message": "Student added to your class"}

    @staticmethod
    def unlink_student(educator_id: str, student_id: str):
        supabase = get_supabase()
        existing = (
            supabase.table("educator_students").select("id").eq("educator_id", educator_id).eq("student_id", student_id).limit(1).execute().data or []
        )
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student link not found")
        supabase.table("educator_students").delete().eq("id", existing[0]["id"]).eq("educator_id", educator_id).execute()
        return {"id": existing[0]["id"], "message": "Student removed from your class"}

    @staticmethod
    def get_educator_dashboard(educator_id: str):
        supabase = get_supabase()
        links = (
            supabase.table("educator_students")
            .select("student_id")
            .eq("educator_id", educator_id)
            .order("assigned_at")
            .execute().data or []
        )
        student_ids = [row["student_id"] for row in links]
        if not student_ids:
            return {
                "summary": {"linked_students": 0, "students_at_risk": 0, "average_prediction": None, "total_study_minutes": 0, "completed_quizzes": 0},
                "students": [],
            }
        profiles = (
            supabase.table("profiles")
            .select("id,username,full_name,school,form_level,target_grade,profile_picture_url")
            .in_("id", student_ids)
            .execute().data or []
        )

        students = []
        all_predictions = []
        for profile in profiles:
            subjects = AnalyticsService.get_subject_analytics(profile["id"])
            mastery_values = [item["overall_mastery"] for item in subjects if item["overall_mastery"] is not None]
            predictions = [item["latest_prediction"] for item in subjects if item["latest_prediction"]]
            latest_prediction = max(predictions, key=lambda item: AnalyticsService._parse_datetime(item["generated_at"])) if predictions else None
            all_predictions.extend(float(item["predicted_score"]) for item in predictions)
            students.append({
                **profile,
                "full_name": profile.get("full_name") or profile["username"],
                "subject_count": len(subjects),
                "study_minutes": sum(item["study_minutes"] for item in subjects),
                "quizzes_completed": sum(item["quizzes_completed"] for item in subjects),
                "average_mastery": round(sum(mastery_values) / len(mastery_values), 1) if mastery_values else None,
                "latest_prediction": float(latest_prediction["predicted_score"]) if latest_prediction else None,
                "at_risk": any(item["is_warning"] for item in predictions),
                "subjects": subjects,
            })

        return {
            "summary": {
                "linked_students": len(students),
                "students_at_risk": sum(1 for student in students if student["at_risk"]),
                "average_prediction": round(sum(all_predictions) / len(all_predictions), 1) if all_predictions else None,
                "total_study_minutes": sum(student["study_minutes"] for student in students),
                "completed_quizzes": sum(student["quizzes_completed"] for student in students),
            },
            "students": students,
        }

    @staticmethod
    def get_learning_recommendations(student_id: str):
        supabase = get_supabase()
        recommendations = (
            supabase.table("learning_recommendations")
            .select("*")
            .eq("student_id", student_id)
            .order("priority_level", desc=True)
            .order("created_at", desc=True)
            .limit(10)
            .execute().data or []
        )
        if not recommendations:
            return []

        subject_ids = list({row["subject_id"] for row in recommendations if row.get("subject_id")})
        topic_ids = list({row["topic_id"] for row in recommendations if row.get("topic_id")})

        subject_names = {}
        if subject_ids:
            subjects = supabase.table("subjects").select("id,subject_name").in_("id", subject_ids).execute().data or []
            subject_names = {row["id"]: row["subject_name"] for row in subjects}

        topic_names = {}
        if topic_ids:
            topics = supabase.table("topics").select("id,topic_name").in_("id", topic_ids).execute().data or []
            topic_names = {row["id"]: row["topic_name"] for row in topics}

        return [
            {
                **rec,
                "subject_name": subject_names.get(rec.get("subject_id")),
                "topic_name": topic_names.get(rec.get("topic_id")),
            }
            for rec in recommendations
        ]

    @staticmethod
    def accept_learning_recommendation(student_id: str, recommendation_id: str):
        supabase = get_supabase()
        response = (
            supabase.table("learning_recommendations")
            .update({"is_accepted": True})
            .eq("id", recommendation_id)
            .eq("student_id", student_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
        return {"id": recommendation_id, "is_accepted": True, "message": "Recommendation accepted"}

    @staticmethod
    def generate_study_plan(student_id: str):
        # 1. Fetch current subject analytics to find weakest topics
        subjects = AnalyticsService.get_subject_analytics(student_id)
        if not subjects:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Not enough activity data to generate a study plan. Complete some quizzes or study sessions first."
            )

        weak_topics = []
        for subject in subjects:
            for topic in subject.get("topic_performance", []):
                score = topic.get("score_percentage")
                # Ensure score is a number before comparing
                if score is not None and isinstance(score, (int, float)) and score < 60:
                    weak_topics.append({
                        "subject_id": subject["id"],
                        "topic_id": topic["topic_id"],
                        "topic_name": topic["topic_name"],
                        "score": score
                    })

        # Sort by score ascending (weakest first)
        weak_topics.sort(key=lambda x: x["score"])

        supabase = get_supabase()
        
        # 2. Fetch existing recommendations
        existing_recs = supabase.table("learning_recommendations").select("*").eq("student_id", student_id).execute().data or []
        accepted_topic_ids = {rec["topic_id"] for rec in existing_recs if rec["is_accepted"] and rec.get("topic_id")}
        has_general_strategy = any(rec["recommendation_type"] == "study_strategy" and rec["is_accepted"] for rec in existing_recs)

        # 3. Filter out weak topics that already have an accepted recommendation
        weak_topics = [wt for wt in weak_topics if wt["topic_id"] not in accepted_topic_ids]

        # Delete old unaccepted recommendations to keep it clean
        supabase.table("learning_recommendations").delete().eq("student_id", student_id).eq("is_accepted", False).execute()

        new_recommendations = []

        if not weak_topics:
            if has_general_strategy or len(accepted_topic_ids) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You already have an active study plan! Complete your accepted recommendations or take more quizzes to refresh your progress."
                )
            
            # If doing well and no prior strategy, give a general study strategy
            general_rec = {
                "student_id": student_id,
                "recommendation_type": "study_strategy",
                "recommendation_text": "You are doing excellent across all subjects! Keep up the spaced repetition to maintain your mastery.",
                "priority_level": 5
            }
            res = supabase.table("learning_recommendations").insert(general_rec).execute()
            if res.data:
                new_recommendations.append(res.data[0])
        else:
            # Generate recommendations for top 3 weakest topics
            for idx, weak_topic in enumerate(weak_topics[:3]):
                rec = {
                    "student_id": student_id,
                    "recommendation_type": "topic_focus",
                    "subject_id": weak_topic["subject_id"],
                    "topic_id": weak_topic["topic_id"],
                    "recommendation_text": f"Your score in '{weak_topic['topic_name']}' is {weak_topic['score']}%. We recommend dedicating your next 2 study sessions exclusively to this topic.",
                    "priority_level": 10 - idx
                }
                res = supabase.table("learning_recommendations").insert(rec).execute()
                if res.data:
                    new_recommendations.append(res.data[0])

        return {
            "message": "Your personalised weekly study plan has been generated based on your latest performance.",
            "recommendations": AnalyticsService.get_learning_recommendations(student_id)
        }
