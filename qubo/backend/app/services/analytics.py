from collections import defaultdict

from app.db.supabase import get_supabase


class AnalyticsService:
    """Build student subject analytics from stored learning records only."""

    @staticmethod
    def get_subject_analytics(student_id: str):
        supabase = get_supabase()

        selected_rows = (
            supabase.table("student_subjects")
            .select("subject_id")
            .eq("student_id", student_id)
            .execute()
            .data
            or []
        )
        subject_ids = [row["subject_id"] for row in selected_rows]
        if not subject_ids:
            return []

        subject_rows = (
            supabase.table("subjects")
            .select("id,subject_name,category")
            .in_("id", subject_ids)
            .order("subject_name")
            .execute()
            .data
            or []
        )
        topic_rows = (
            supabase.table("topics")
            .select("id,subject_id,topic_name,difficulty_level")
            .in_("subject_id", subject_ids)
            .order("topic_name")
            .execute()
            .data
            or []
        )
        topic_ids = [topic["id"] for topic in topic_rows]

        performance_rows = []
        if topic_ids:
            performance_rows = (
                supabase.table("performance_records")
                .select("topic_id,score_percentage,sessions_count,last_updated")
                .eq("student_id", student_id)
                .in_("topic_id", topic_ids)
                .execute()
                .data
                or []
            )

        session_rows = (
            supabase.table("study_sessions")
            .select("subject_id,duration_minutes")
            .eq("student_id", student_id)
            .in_("subject_id", subject_ids)
            .execute()
            .data
            or []
        )
        attempt_rows = (
            supabase.table("quiz_attempts")
            .select("quiz_id,score,attempted_at")
            .eq("student_id", student_id)
            .order("attempted_at")
            .execute()
            .data
            or []
        )
        attempted_quiz_ids = list({row["quiz_id"] for row in attempt_rows})
        quiz_subjects = {}
        if attempted_quiz_ids:
            quiz_rows = (
                supabase.table("quizzes")
                .select("id,subject_id")
                .in_("id", attempted_quiz_ids)
                .execute()
                .data
                or []
            )
            quiz_subjects = {row["id"]: row.get("subject_id") for row in quiz_rows}

        topics_by_subject = defaultdict(list)
        for topic in topic_rows:
            topics_by_subject[topic["subject_id"]].append(topic)

        performance_by_topic = {row["topic_id"]: row for row in performance_rows}
        minutes_by_subject = defaultdict(int)
        for session in session_rows:
            minutes_by_subject[session["subject_id"]] += session.get("duration_minutes") or 0

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
                    "sessions_count": performance.get("sessions_count", 0) if performance else 0,
                    "last_updated": performance.get("last_updated") if performance else None,
                })

            subject_attempts = attempts_by_subject[subject["id"]]
            mastery_scores = measured_scores or [float(attempt["score"]) for attempt in subject_attempts]
            result.append({
                "id": subject["id"],
                "subject_name": subject["subject_name"],
                "category": subject.get("category"),
                "overall_mastery": round(sum(mastery_scores) / len(mastery_scores), 1) if mastery_scores else None,
                "topics_total": len(subject_topics),
                "topics_measured": len(measured_scores),
                "study_minutes": minutes_by_subject[subject["id"]],
                "quizzes_completed": len(subject_attempts),
                "topic_performance": topic_performance,
                "recent_quiz_scores": [
                    {
                        "score": float(attempt["score"]),
                        "attempted_at": attempt["attempted_at"],
                    }
                    for attempt in subject_attempts[-12:]
                ],
            })

        return result
