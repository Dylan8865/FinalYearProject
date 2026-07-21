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

    @staticmethod
    def create_video(educator_id: str, title: str, youtube_url: str, subject_tag: str | None) -> dict:
        try:
            existing = get_supabase().table('videos').select('video_id').eq('youtube_url', youtube_url).maybe_single().execute().data
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='That YouTube URL has already been added.')
            created = get_supabase().table('videos').insert({
                'uploaded_by': educator_id, 'title': title.strip(), 'youtube_url': youtube_url.strip(),
                'subject_tag': subject_tag.strip() if subject_tag else None,
            }).execute().data
            if not created:
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Tutorial video could not be created.')
            from app.services.collection import CollectionService
            CollectionService.add_uploaded_item(educator_id, 'video', created[0]['video_id'])
            return created[0]
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Tutorial video could not be created in Supabase.') from exc
