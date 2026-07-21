from datetime import datetime, timezone
from typing import Dict, List

from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class ActivityService:
    """Persist a student's recent resource and video activity."""

    @classmethod
    def _record_view(cls, user_id: str, target_column: str, target_id: str) -> None:
        try:
            existing_response = (
                get_supabase()
                .table("user_resources")
                .select("user_resource_id,last_viewed_at,view_count")
                .eq("user_id", user_id)
                .eq(target_column, target_id)
                .limit(1)
                .execute()
            )
            existing_rows = existing_response.data or []
            existing = existing_rows[0] if existing_rows else None
            now = datetime.now(timezone.utc).isoformat()

            if existing:
                (
                    get_supabase()
                    .table("user_resources")
                    .update({
                        "last_viewed_at": now,
                    })
                    .eq("user_resource_id", existing["user_resource_id"])
                    .execute()
                )
                return

            (
                get_supabase()
                .table("user_resources")
                .insert({
                    "user_id": user_id,
                    target_column: target_id,
                    "last_viewed_at": now,
                    "view_count": 1,
                })
                .execute()
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Learning activity could not be recorded. Apply the resource activity migration first.",
            ) from exc

    @classmethod
    def record_resource_view(cls, user_id: str, resource_id: str) -> None:
        cls._record_view(user_id, "resource_id", resource_id)

    @classmethod
    def record_video_view(cls, user_id: str, video_id: str) -> None:
        cls._record_view(user_id, "video_id", video_id)

    @classmethod
    def remove_recent_item(cls, user_id: str, target_type: str, target_id: str) -> None:
        target_column = "resource_id" if target_type == "model" else "video_id"
        try:
            get_supabase().table("user_resources").delete().eq("user_id", user_id).eq(target_column, target_id).execute()
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Recent learning item could not be removed.") from exc

    @staticmethod
    def list_recent_learning(user_id: str, limit: int = 6) -> List[dict]:
        try:
            activity_rows = (
                get_supabase()
                .table("user_resources")
                .select("resource_id,video_id,last_viewed_at,view_count")
                .eq("user_id", user_id)
                .order("last_viewed_at", desc=True)
                .limit(limit)
                .execute()
                .data
                or []
            )

            resource_ids = [row["resource_id"] for row in activity_rows if row.get("resource_id")]
            video_ids = [row["video_id"] for row in activity_rows if row.get("video_id")]
            resources_by_id: Dict[str, dict] = {}
            videos_by_id: Dict[str, dict] = {}

            if resource_ids:
                resources = (
                    get_supabase()
                    .table("resources")
                    .select("resource_id,title,topics(topic_name,subjects(subject_name))")
                    .in_("resource_id", resource_ids)
                    .execute()
                    .data
                    or []
                )
                resources_by_id = {resource["resource_id"]: resource for resource in resources}

            if video_ids:
                videos = (
                    get_supabase()
                    .table("videos")
                    .select("video_id,title,subject_tag")
                    .in_("video_id", video_ids)
                    .execute()
                    .data
                    or []
                )
                videos_by_id = {video["video_id"]: video for video in videos}

            recent_items = []
            for row in activity_rows:
                if row.get("resource_id"):
                    resource = resources_by_id.get(row["resource_id"])
                    if not resource:
                        continue
                    topic = resource.get("topics") or {}
                    subject = (topic.get("subjects") or {}).get("subject_name")
                    recent_items.append({
                        "target_id": row["resource_id"],
                        "target_type": "model",
                        "title": resource["title"],
                        "subject_name": subject or topic.get("topic_name"),
                        "last_viewed_at": row["last_viewed_at"],
                        "view_count": row["view_count"],
                    })
                    continue

                video = videos_by_id.get(row.get("video_id"))
                if video:
                    recent_items.append({
                        "target_id": row["video_id"],
                        "target_type": "video",
                        "title": video["title"],
                        "subject_name": video.get("subject_tag"),
                        "last_viewed_at": row["last_viewed_at"],
                        "view_count": row["view_count"],
                    })
            return recent_items
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Recent learning activity could not be loaded.",
            ) from exc
