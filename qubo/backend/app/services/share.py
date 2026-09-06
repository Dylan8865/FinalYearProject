from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class ContentShareService:
    @staticmethod
    def share(
        target_type: str, target_id: str, sender_id: str, sender_role: str, recipient_email: str, message: Optional[str]
    ) -> None:
        if target_type not in {"model", "video"}:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")
        supabase = get_supabase()
        try:
            recipient_rows = supabase.table("profiles").select("id, role").ilike("email", recipient_email.strip()).limit(1).execute().data or []
            if not recipient_rows:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or sharing not permitted.")
            recipient_id = recipient_rows[0]["id"]
            recipient_role = recipient_rows[0]["role"]
            if recipient_id == sender_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot share content with yourself.")
            
            if sender_role == "student" and recipient_role != "student":
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or sharing not permitted.")
            target_column = "resource_id" if target_type == "model" else "video_id"
            target_table = "resources" if target_type == "model" else "videos"
            target_key = "resource_id" if target_type == "model" else "video_id"
            target_query = supabase.table(target_table).select(target_key).eq(target_key, target_id)
            if target_type == "model":
                target_query = target_query.in_("resource_type", ["3d_model", "3D Model"])
            target_rows = target_query.limit(1).execute().data or []
            if not target_rows:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="3D model not found." if target_type == "model" else "Tutorial video not found.")
            existing = supabase.table("content_shares").select("share_id").eq(target_column, target_id).eq("sender_id", sender_id).eq("recipient_id", recipient_id).limit(1).execute().data or []
            if not existing:
                supabase.table("content_shares").insert({target_column: target_id, "sender_id": sender_id, "recipient_id": recipient_id, "message": message.strip() if message else None}).execute()
            else:
                # Re-sharing restores a previously dismissed item and moves it
                # back to the top of the recipient's inbox.
                supabase.table("content_shares").update({"message": message.strip() if message else None, "shared_at": datetime.now(timezone.utc).isoformat(), "dismissed_at": None}).eq("share_id", existing[0]["share_id"]).execute()
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Content could not be shared. Apply the content shares migrations first.") from exc

    @staticmethod
    def list_received(user_id: str) -> List[dict]:
        supabase = get_supabase()
        try:
            shares = supabase.table("content_shares").select("share_id,video_id,resource_id,sender_id,message,shared_at").eq("recipient_id", user_id).is_("dismissed_at", "null").order("shared_at", desc=True).execute().data or []
            if not shares:
                return []
            video_ids = [share["video_id"] for share in shares if share.get("video_id")]
            resource_ids = [share["resource_id"] for share in shares if share.get("resource_id")]
            sender_ids = [share["sender_id"] for share in shares]
            videos = supabase.table("videos").select("video_id,title,subject_tag").in_("video_id", video_ids).execute().data or [] if video_ids else []
            resources = supabase.table("resources").select("resource_id,title,topics(topic_name,subjects(subject_name))").in_("resource_id", resource_ids).execute().data or [] if resource_ids else []
            senders = supabase.table("profiles").select("id,email").in_("id", sender_ids).execute().data or []
            video_map = {video["video_id"]: video for video in videos}
            resource_map = {resource["resource_id"]: resource for resource in resources}
            sender_map = {sender["id"]: sender.get("email") or "Qubo learner" for sender in senders}
            result = []
            for share in shares:
                common = {"share_id": share["share_id"], "sender_email": sender_map.get(share["sender_id"], "Qubo learner"), "message": share.get("message"), "shared_at": share["shared_at"]}
                if share.get("video_id") in video_map:
                    video = video_map[share["video_id"]]
                    result.append({**common, "target_type": "video", "target_id": video["video_id"], "title": video["title"], "subject_name": video.get("subject_tag")})
                elif share.get("resource_id") in resource_map:
                    resource = resource_map[share["resource_id"]]
                    topic = resource.get("topics") or {}
                    subject = topic.get("subjects") or {}
                    result.append({**common, "target_type": "model", "target_id": resource["resource_id"], "title": resource["title"], "subject_name": subject.get("subject_name")})
            return result
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Shared learning content could not be loaded.") from exc

    @staticmethod
    def set_dismissed(share_id: str, recipient_id: str, dismissed: bool) -> None:
        try:
            update = {"dismissed_at": datetime.now(timezone.utc).isoformat() if dismissed else None}
            response = get_supabase().table("content_shares").update(update).eq("share_id", share_id).eq("recipient_id", recipient_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Shared content not found.")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Shared content could not be updated. Apply the content shares migrations first.") from exc
