from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class VideoShareService:
    @staticmethod
    def share(video_id: str, sender_id: str, recipient_username: str, message: str | None) -> None:
        supabase = get_supabase()
        try:
            recipient_rows = supabase.table("profiles").select("id").ilike("username", recipient_username.strip()).limit(1).execute().data or []
            if not recipient_rows:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Qubo user has that username.")
            recipient_id = recipient_rows[0]["id"]
            if recipient_id == sender_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot share a video with yourself.")
            video_rows = supabase.table("videos").select("video_id").eq("video_id", video_id).limit(1).execute().data or []
            if not video_rows:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutorial video not found.")
            existing = supabase.table("video_shares").select("share_id").eq("video_id", video_id).eq("sender_id", sender_id).eq("recipient_id", recipient_id).limit(1).execute().data or []
            if not existing:
                supabase.table("video_shares").insert({"video_id": video_id, "sender_id": sender_id, "recipient_id": recipient_id, "message": message.strip() if message else None}).execute()
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Video could not be shared. Apply the video shares migration first.") from exc

    @staticmethod
    def list_received(user_id: str) -> list[dict]:
        supabase = get_supabase()
        try:
            shares = supabase.table("video_shares").select("share_id,video_id,sender_id,message,shared_at").eq("recipient_id", user_id).order("shared_at", desc=True).execute().data or []
            if not shares:
                return []
            video_ids = [share["video_id"] for share in shares]
            sender_ids = [share["sender_id"] for share in shares]
            videos = supabase.table("videos").select("video_id,youtube_url,title,subject_tag").in_("video_id", video_ids).execute().data or []
            senders = supabase.table("profiles").select("id,username").in_("id", sender_ids).execute().data or []
            video_map = {video["video_id"]: video for video in videos}
            sender_map = {sender["id"]: sender["username"] for sender in senders}
            return [{**video_map[share["video_id"]], "share_id": share["share_id"], "sender_username": sender_map.get(share["sender_id"], "Qubo learner"), "message": share.get("message"), "shared_at": share["shared_at"]} for share in shares if share["video_id"] in video_map]
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Shared videos could not be loaded.") from exc
