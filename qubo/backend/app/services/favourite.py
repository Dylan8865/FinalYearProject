from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class FavouriteService:
    """Student-owned saved videos and learning resources."""

    @staticmethod
    def _target_column(target_type: str) -> str:
        return "resource_id" if target_type == "model" else "video_id"

    @classmethod
    def _ensure_target_exists(cls, target_type: str, target_id: str) -> None:
        table = "resources" if target_type == "model" else "videos"
        column = cls._target_column(target_type)
        try:
            result = get_supabase().table(table).select(column).eq(column, target_id).limit(1).execute().data or []
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Saved item could not be verified.") from exc
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning item not found.")

    @classmethod
    def save(cls, user_id: str, target_type: str, target_id: str) -> None:
        cls._ensure_target_exists(target_type, target_id)
        column = cls._target_column(target_type)
        try:
            existing = (
                get_supabase().table("user_favourites").select("favourite_id")
                .eq("user_id", user_id).eq(column, target_id).limit(1).execute().data or []
            )
            if not existing:
                get_supabase().table("user_favourites").insert({"user_id": user_id, column: target_id}).execute()
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Learning item could not be saved. Apply the favourites migration first.") from exc

    @classmethod
    def remove(cls, user_id: str, target_type: str, target_id: str) -> None:
        column = cls._target_column(target_type)
        try:
            get_supabase().table("user_favourites").delete().eq("user_id", user_id).eq(column, target_id).execute()
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Saved item could not be removed.") from exc

    @staticmethod
    def list_for_user(user_id: str) -> list[dict]:
        try:
            favourites = (
                get_supabase().table("user_favourites")
                .select("resource_id,video_id,date_added").eq("user_id", user_id)
                .order("date_added", desc=True).execute().data or []
            )
            resource_ids = [row["resource_id"] for row in favourites if row.get("resource_id")]
            video_ids = [row["video_id"] for row in favourites if row.get("video_id")]
            resources = [] if not resource_ids else (
                get_supabase().table("resources").select("resource_id,title,topics(topic_name,subjects(subject_name))")
                .in_("resource_id", resource_ids).execute().data or []
            )
            videos = [] if not video_ids else (
                get_supabase().table("videos").select("video_id,title,subject_tag")
                .in_("video_id", video_ids).execute().data or []
            )
            resource_map = {item["resource_id"]: item for item in resources}
            video_map = {item["video_id"]: item for item in videos}
            result = []
            for favourite in favourites:
                resource = resource_map.get(favourite.get("resource_id"))
                if resource:
                    topic = resource.get("topics") or {}
                    result.append({"target_id": resource["resource_id"], "target_type": "model", "title": resource["title"], "subject_name": (topic.get("subjects") or {}).get("subject_name") or topic.get("topic_name"), "date_added": favourite["date_added"]})
                    continue
                video = video_map.get(favourite.get("video_id"))
                if video:
                    result.append({"target_id": video["video_id"], "target_type": "video", "title": video["title"], "subject_name": video.get("subject_tag"), "date_added": favourite["date_added"]})
            return result
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Saved learning items could not be loaded.") from exc
