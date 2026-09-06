from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class VideoService:
    """Read-only tutorial video queries for the student resource area."""

    @staticmethod
    def list_videos(search: Optional[str] = None, subject: Optional[str] = None, uploader_id: Optional[str] = None) -> List[dict]:
        try:
            query = (
                get_supabase()
                .table("videos")
                .select("video_id,youtube_url,title,subject_tag,uploaded_by,is_locked,is_deleted")
                .order("title")
            )

            if subject:
                query = query.eq("subject_tag", subject)
            if search:
                query = query.ilike("title", f"%{search.strip()}%")
            if uploader_id:
                # Educators viewing their own uploads: show locked AND soft-deleted (corpses)
                query = query.eq("uploaded_by", uploader_id)
            else:
                # Students / public: hide locked AND soft-deleted content
                query = query.eq("is_locked", False).eq("is_deleted", False)

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
    def create_video(educator_id: str, title: str, youtube_url: str, subject_tag: Optional[str]) -> dict:
        from app.services.moderation import AIModerationService
        scan = AIModerationService.scan_multiple(title, subject_tag)
        try:
            # A missing row is the normal case for a new upload.  Do not use
            # maybe_single() here: PostgREST can turn a zero-row result into a
            # 406 response, which was being reported as a generic upload
            # failure before the insert was reached.
            existing_rows = (
                get_supabase().table('videos').select('video_id')
                .eq('youtube_url', youtube_url.strip()).limit(1).execute().data
                or []
            )
            if existing_rows:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='That YouTube URL has already been added.')
            created = get_supabase().table('videos').insert({
                'uploaded_by': educator_id, 'title': title.strip(), 'youtube_url': youtube_url.strip(),
                'subject_tag': subject_tag.strip() if subject_tag else None,
                'is_locked': not scan['is_safe'],
                'locked_reason': scan['flag_reason'],
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

    @staticmethod
    def delete_video(video_id: str, educator_id: str) -> None:
        supabase = get_supabase()
        try:
            owned = supabase.table('videos').select('video_id').eq('video_id', video_id).eq('uploaded_by', educator_id).eq('is_locked', False).eq('is_deleted', False).limit(1).execute().data or []
            if not owned:
                raise HTTPException(status_code=404, detail='Video not found or not owned by this educator.')
            for table in ('content_shares', 'educator_recommendations', 'user_favourites', 'user_resources', 'learning_events'):
                supabase.table(table).delete().eq('video_id', video_id).execute()
            deleted = supabase.table('videos').delete().eq('video_id', video_id).eq('uploaded_by', educator_id).execute().data or []
            if not deleted:
                raise HTTPException(status_code=404, detail='Video not found or not owned by this educator.')
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail='Tutorial video could not be deleted.') from exc
