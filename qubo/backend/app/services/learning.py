from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.services.activity import ActivityService


class LearningService:
    """Validate and store bounded learning signals used by Qubo."""

    EVENT_TARGETS = {
        "opened": {"model", "video"}, "saved": {"model", "video"},
        "unsaved": {"model", "video"}, "shared": {"model", "video"},
        "completed": {"model", "video"}, "model_explored": {"model"}, "model_viewed": {"model"},
        "video_played": {"video"}, "video_paused": {"video"},
        "video_progress": {"video"}, "skipped_quickly": {"video"},
        "rewound": {"video"}, "quiz_attempted": {"quiz"},
        "quiz_completed": {"quiz"},
    }
    METADATA_KEYS = {
        "duration_seconds", "progress_percent", "current_time_seconds",
        "rewind_seconds", "quiz_title", "subject_name", "topic_name",
        "score_percent", "question_count", "source",
    }

    @classmethod
    def _target_context(cls, target_type: str, target_id: str | None) -> tuple[str | None, str | None, str | None]:
        if target_type == "quiz":
            return None, None, None
        if not target_id:
            raise HTTPException(status_code=422, detail="A model or video event needs a target id.")
        try:
            if target_type == "model":
                row = get_supabase().table("resources").select(
                    "resource_id,topics(topic_name,subjects(subject_name))"
                ).eq("resource_id", target_id).maybe_single().execute().data
                if not row:
                    raise HTTPException(status_code=404, detail="3D model not found.")
                topic = row.get("topics") or {}
                subject = (topic.get("subjects") or {}).get("subject_name")
                return row["resource_id"], None, subject or topic.get("topic_name")
            row = get_supabase().table("videos").select("video_id,subject_tag").eq("video_id", target_id).maybe_single().execute().data
            if not row:
                raise HTTPException(status_code=404, detail="Video not found.")
            return None, row["video_id"], row.get("subject_tag")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Learning target could not be checked.") from exc

    @classmethod
    def _safe_metadata(cls, metadata: dict[str, Any], inferred_subject: str | None) -> dict[str, Any]:
        safe: dict[str, Any] = {}
        for key, value in metadata.items():
            if key not in cls.METADATA_KEYS:
                continue
            if isinstance(value, str):
                safe[key] = value.strip()[:160]
            elif isinstance(value, (int, float)) and not isinstance(value, bool):
                safe[key] = max(0, min(float(value), 14_400))
        if inferred_subject:
            safe["subject_name"] = inferred_subject
        return safe

    @classmethod
    def record(cls, user_id: str, payload: dict[str, Any]) -> None:
        event_type = payload["event_type"]
        target_type = payload["target_type"]
        if target_type not in cls.EVENT_TARGETS[event_type]:
            raise HTTPException(status_code=422, detail="This event is not valid for that learning target.")

        target_id = str(payload["target_id"]) if payload.get("target_id") else None
        resource_id, video_id, subject = cls._target_context(target_type, target_id)
        metadata = cls._safe_metadata(payload.get("metadata") or {}, subject)
        if target_type == "quiz" and not metadata.get("subject_name"):
            metadata["subject_name"] = "General quiz"
        try:
            get_supabase().table("learning_events").insert({
                "user_id": user_id,
                "target_type": target_type,
                "resource_id": resource_id,
                "video_id": video_id,
                "event_type": event_type,
                "session_id": str(payload["session_id"]) if payload.get("session_id") else None,
                "metadata": metadata,
            }).execute()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Learning event could not be saved. Apply the learning-events migration first.",
            ) from exc

    @classmethod
    def mark_completed(cls, user_id: str, target_type: str, target_id: str, session_id: str | None = None) -> None:
        target_column = "resource_id" if target_type == "model" else "video_id"
        if target_type == "model":
            ActivityService.record_resource_view(user_id, target_id)
        else:
            ActivityService.record_video_view(user_id, target_id)
        now = datetime.now(timezone.utc).isoformat()
        try:
            existing = get_supabase().table("user_resources").select("is_completed").eq("user_id", user_id).eq(target_column, target_id).limit(1).execute().data or []
            if existing and existing[0].get("is_completed"):
                return
            get_supabase().table("user_resources").update({
                "is_completed": True, "completed_at": now,
            }).eq("user_id", user_id).eq(target_column, target_id).execute()
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Completion status could not be updated.") from exc
        cls.record(user_id, {
            "target_type": target_type, "target_id": target_id,
            "event_type": "completed", "session_id": session_id, "metadata": {},
        })

    @classmethod
    def completion_status(cls, user_id: str, target_type: str, target_id: str) -> dict:
        target_column = "resource_id" if target_type == "model" else "video_id"
        try:
            rows = get_supabase().table("user_resources").select("is_completed").eq("user_id", user_id).eq(target_column, target_id).limit(1).execute().data or []
            return {"is_completed": bool(rows and rows[0].get("is_completed"))}
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Completion status could not be loaded.") from exc

    @classmethod
    def educator_analytics(cls) -> dict:
        since = (datetime.now(timezone.utc) - timedelta(days=13)).isoformat()
        try:
            rows = get_supabase().table("learning_events").select(
                "user_id,event_type,occurred_at,metadata"
            ).gte("occurred_at", since).execute().data or []
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Learning analytics could not be loaded. Apply the learning-events migration first.") from exc

        subject_counts: Counter[str] = Counter()
        day_counts: Counter[str] = Counter()
        for row in rows:
            metadata = row.get("metadata") or {}
            if metadata.get("subject_name"):
                subject_counts[str(metadata["subject_name"])] += 1
            day_counts[str(row["occurred_at"])[:10]] += 1
        days = [(datetime.now(timezone.utc).date() - timedelta(days=offset)).isoformat() for offset in range(13, -1, -1)]
        return {
            "active_learners": len({row["user_id"] for row in rows}),
            "total_learning_events": len(rows),
            "completions": sum(row["event_type"] in {"completed", "quiz_completed"} for row in rows),
            "model_explorations": sum(row["event_type"] == "model_explored" for row in rows),
            "video_learning_actions": sum(row["event_type"] in {"video_played", "video_progress", "video_paused", "rewound"} for row in rows),
            "top_subjects": [{"subject_name": name, "event_count": count} for name, count in subject_counts.most_common(5)],
            "daily_activity": [{"date": day, "event_count": day_counts[day]} for day in days],
        }
