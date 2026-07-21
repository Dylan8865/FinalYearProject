from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class VideoService:
    """Read-only tutorial video queries for the student resource area."""

    @staticmethod
    def list_videos(search: str | None = None, subject: str | None = None) -> list[dict]:
        try:
            query = (
                get_supabase()
                .table("videos")
                .select("video_id,youtube_url,title,subject_tag")
                .order("title")
            )

            if subject:
                query = query.eq("subject_tag", subject)
            if search:
                query = query.ilike("title", f"%{search.strip()}%")

            return query.execute().data or []
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Tutorial videos could not be loaded from Supabase.",
            ) from exc

    @staticmethod
    def ensure_video_exists(video_id: str) -> None:
        try:
            video = (
                get_supabase()
                .table("videos")
                .select("video_id")
                .eq("video_id", video_id)
                .maybe_single()
                .execute()
                .data
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Tutorial video could not be verified.",
            ) from exc

        if not video:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutorial video not found.")
