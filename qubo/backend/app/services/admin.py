from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.services.resource import ResourceService
from app.services.video import VideoService


class AdminService:
    """Privileged operations for the isolated Qubo Admin portal."""

    @staticmethod
    def _audit(admin_id: str, action: str, target_type: str, target_id: str | None = None,
               target_user_id: str | None = None, reason: str | None = None,
               metadata: dict[str, Any] | None = None) -> None:
        get_supabase().table("admin_audit_logs").insert({
            "admin_id": admin_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "target_user_id": target_user_id,
            "reason": reason,
            "metadata": metadata or {},
        }).execute()

    @classmethod
    def list_content(cls, content_type: str) -> list[dict]:
        supabase = get_supabase()
        try:
            profiles = supabase.table("profiles").select("id,full_name,username").execute().data or []
            owners = {row["id"]: row.get("full_name") or row.get("username") or "Unknown educator" for row in profiles}
            recommendations = supabase.table("educator_recommendations").select("video_id,resource_id").execute().data or []
            recommendation_counts = Counter(
                row.get("video_id") or row.get("resource_id") for row in recommendations if row.get("video_id") or row.get("resource_id")
            )
            if content_type == "video":
                rows = supabase.table("videos").select("video_id,title,youtube_url,subject_tag,uploaded_by").order("title").execute().data or []
                return [{
                    "id": row["video_id"], "type": "video", "title": row["title"],
                    "subject_name": row.get("subject_tag"), "uploaded_by": row.get("uploaded_by"),
                    "owner_name": owners.get(row.get("uploaded_by"), "Unknown educator"),
                    "recommendation_count": recommendation_counts.get(row["video_id"], 0),
                    "youtube_url": row.get("youtube_url"), "visibility": "public",
                } for row in rows]

            rows = supabase.table("resources").select(
                "resource_id,title,visibility,created_by,topics(topic_name,subjects(subject_name))"
            ).in_("resource_type", ResourceService.MODEL_TYPES).order("title").execute().data or []
            return [{
                "id": row["resource_id"], "type": "model", "title": row["title"],
                "subject_name": ((row.get("topics") or {}).get("subjects") or {}).get("subject_name"),
                "topic_name": (row.get("topics") or {}).get("topic_name"),
                "uploaded_by": row.get("created_by"),
                "owner_name": owners.get(row.get("created_by"), "Unknown educator"),
                "recommendation_count": recommendation_counts.get(row["resource_id"], 0),
                "visibility": row.get("visibility") or "public",
            } for row in rows]
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Admin content could not be loaded.") from exc

    @classmethod
    def update_content(cls, admin_id: str, content_type: str, content_id: str, payload: dict) -> dict:
        supabase = get_supabase()
        title = payload["title"].strip()
        if content_type == "video":
            updated = supabase.table("videos").update({
                "title": title, "subject_tag": (payload.get("subject_name") or "").strip() or None,
            }).eq("video_id", content_id).execute().data or []
        else:
            existing = supabase.table("resources").select("resource_id,topic_id").eq("resource_id", content_id).limit(1).execute().data or []
            if not existing:
                raise HTTPException(status_code=404, detail="3D model not found.")
            changes: dict[str, Any] = {"title": title}
            if payload.get("visibility"):
                changes["visibility"] = payload["visibility"]
            subject_name = (payload.get("subject_name") or "").strip()
            if subject_name:
                subject_rows = supabase.table("subjects").select("id").eq("subject_name", subject_name).limit(1).execute().data or []
                subject = subject_rows[0] if subject_rows else supabase.table("subjects").insert({"subject_name": subject_name}).execute().data[0]
                topic_rows = supabase.table("topics").select("id").eq("subject_id", subject["id"]).eq("topic_name", "General").limit(1).execute().data or []
                topic = topic_rows[0] if topic_rows else supabase.table("topics").insert({"subject_id": subject["id"], "topic_name": "General"}).execute().data[0]
                changes["topic_id"] = topic["id"]
            updated = supabase.table("resources").update(changes).eq("resource_id", content_id).execute().data or []
        if not updated:
            raise HTTPException(status_code=404, detail="Content was not found.")
        cls._audit(admin_id, "content_updated", content_type, content_id, metadata={"title": title})
        return updated[0]

    @classmethod
    def delete_content(cls, admin_id: str, content_type: str, content_id: str) -> None:
        supabase = get_supabase()
        try:
            if content_type == "video":
                video = supabase.table("videos").select("video_id,uploaded_by").eq("video_id", content_id).limit(1).execute().data or []
                if not video:
                    raise HTTPException(status_code=404, detail="Video not found.")
                for table in ("content_shares", "educator_recommendations", "user_favourites", "user_resources", "learning_events"):
                    supabase.table(table).delete().eq("video_id", content_id).execute()
                supabase.table("videos").delete().eq("video_id", content_id).execute()
            else:
                model = supabase.table("resources").select("resource_id,url").eq("resource_id", content_id).limit(1).execute().data or []
                if not model:
                    raise HTTPException(status_code=404, detail="3D model not found.")
                for table in ("resource_annotations", "content_shares", "educator_recommendations", "user_favourites", "user_resources", "learning_events"):
                    supabase.table(table).delete().eq("resource_id", content_id).execute()
                supabase.table("resources").delete().eq("resource_id", content_id).execute()
                try:
                    supabase.storage.from_(ResourceService.STORAGE_BUCKET).remove([model[0]["url"]])
                except Exception:
                    pass
            cls._audit(admin_id, "content_deleted", content_type, content_id)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Content could not be deleted.") from exc

    @classmethod
    def list_users(cls, search: str | None = None) -> list[dict]:
        try:
            query = get_supabase().table("profiles").select(
                "id,username,full_name,email,role,failed_login_attempts,locked_until,is_blacklisted,blacklisted_at,blacklist_reason,created_at"
            ).order("created_at", desc=True)
            if search:
                query = query.or_(f"username.ilike.%{search.strip()}%,email.ilike.%{search.strip()}%,full_name.ilike.%{search.strip()}%")
            return query.execute().data or []
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Users could not be loaded.") from exc

    @classmethod
    def set_lock(cls, admin_id: str, user_id: str, locked: bool, reason: str | None) -> None:
        if admin_id == user_id:
            raise HTTPException(status_code=400, detail="Administrators cannot lock their own account.")
        locked_until = (datetime.now(timezone.utc) + timedelta(days=3650)).isoformat() if locked else None
        updated = get_supabase().table("profiles").update({"locked_until": locked_until, "failed_login_attempts": 5 if locked else 0}).eq("id", user_id).execute().data or []
        if not updated:
            raise HTTPException(status_code=404, detail="User not found.")
        cls._audit(admin_id, "account_locked" if locked else "account_unlocked", "user", user_id, user_id, reason)

    @classmethod
    def set_blacklist(cls, admin_id: str, user_id: str, blacklisted: bool, reason: str | None) -> None:
        if admin_id == user_id:
            raise HTTPException(status_code=400, detail="Administrators cannot blacklist themselves.")
        changes = {
            "is_blacklisted": blacklisted,
            "blacklisted_at": datetime.now(timezone.utc).isoformat() if blacklisted else None,
            "blacklisted_by": admin_id if blacklisted else None,
            "blacklist_reason": reason if blacklisted else None,
        }
        updated = get_supabase().table("profiles").update(changes).eq("id", user_id).execute().data or []
        if not updated:
            raise HTTPException(status_code=404, detail="User not found.")
        cls._audit(admin_id, "user_blacklisted" if blacklisted else "user_unblacklisted", "user", user_id, user_id, reason)

    @classmethod
    def set_temporary_password(cls, admin_id: str, user_id: str, password: str) -> None:
        if admin_id == user_id:
            raise HTTPException(status_code=400, detail="Use your own password settings instead.")
        get_supabase().auth.admin.update_user_by_id(user_id, {"password": password})
        cls._audit(admin_id, "temporary_password_set", "user", user_id, user_id)

    @classmethod
    def send_password_reset(cls, admin_id: str, email: str) -> None:
        get_supabase().auth.reset_password_email(email.strip().lower())
        cls._audit(admin_id, "password_reset_email_sent", "user", metadata={"email": email.strip().lower()})

    @classmethod
    def delete_user(cls, admin_id: str, user_id: str) -> None:
        supabase = get_supabase()
        if admin_id == user_id:
            raise HTTPException(status_code=400, detail="Administrators cannot delete their own account.")
        profile_rows = supabase.table("profiles").select("id,role").eq("id", user_id).limit(1).execute().data or []
        if not profile_rows:
            raise HTTPException(status_code=404, detail="User not found.")
        if profile_rows[0].get("role") == "admin":
            raise HTTPException(status_code=403, detail="Administrator accounts must be managed manually.")

        # Delete owned content first so its storage and dependent learning data
        # cannot be left behind. The remaining table deletes clear user activity.
        for video in supabase.table("videos").select("video_id").eq("uploaded_by", user_id).execute().data or []:
            cls.delete_content(admin_id, "video", video["video_id"])
        for model in supabase.table("resources").select("resource_id").eq("created_by", user_id).in_("resource_type", ResourceService.MODEL_TYPES).execute().data or []:
            cls.delete_content(admin_id, "model", model["resource_id"])

        try:
            session_ids = [row["id"] for row in (supabase.table("study_sessions").select("id").eq("student_id", user_id).execute().data or [])]
            if session_ids:
                supabase.table("session_topics").delete().in_("session_id", session_ids).execute()
            attempt_ids = [row["id"] for row in (supabase.table("quiz_attempts").select("id").eq("student_id", user_id).execute().data or [])]
            if attempt_ids:
                supabase.table("attempt_answers").delete().in_("attempt_id", attempt_ids).execute()
            quiz_ids = [row["id"] for row in (supabase.table("quizzes").select("id").eq("owner_id", user_id).execute().data or [])]
            if quiz_ids:
                question_ids = [row["id"] for row in (supabase.table("questions").select("id").in_("quiz_id", quiz_ids).execute().data or [])]
                if question_ids:
                    supabase.table("question_options").delete().in_("question_id", question_ids).execute()
                supabase.table("quiz_assignments").delete().in_("quiz_id", quiz_ids).execute()
                supabase.table("questions").delete().in_("quiz_id", quiz_ids).execute()
                supabase.table("quizzes").delete().in_("id", quiz_ids).execute()
            match_ids = [row["match_id"] for row in (supabase.table("matches").select("match_id").eq("user_id", user_id).execute().data or [])]
            if match_ids:
                supabase.table("match_history").delete().in_("match_id", match_ids).execute()
            for table, column in (("student_subjects", "student_id"), ("performance_records", "student_id"), ("spaced_repetition_schedule", "student_id"), ("study_sessions", "student_id"), ("quiz_attempts", "student_id"), ("matches", "user_id"), ("user_resources", "user_id"), ("user_favourites", "user_id"), ("achievements", "user_id"), ("learning_events", "user_id"), ("educator_recommendations", "educator_id"), ("resource_annotations", "created_by"), ("collection_shares", "student_id"), ("collection_shares", "shared_by"), ("collections", "educator_id"), ("educator_students", "educator_id"), ("educator_students", "student_id"), ("content_shares", "sender_id"), ("content_shares", "recipient_id")):
                supabase.table(table).delete().eq(column, user_id).execute()
            try:
                supabase.storage.from_("avatars").remove([f"{user_id}/avatar"])
            except Exception:
                # A missing avatar must not block account/data deletion.
                pass
            supabase.table("profiles").delete().eq("id", user_id).execute()
            supabase.auth.admin.delete_user(user_id)
            cls._audit(admin_id, "user_deleted", "user", user_id, None, metadata={"deleted_user_id": user_id})
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="User data could not be fully deleted.") from exc

    @classmethod
    def analytics(cls) -> dict:
        supabase = get_supabase()
        try:
            profiles = supabase.table("profiles").select("role,locked_until,is_blacklisted").execute().data or []
            videos = supabase.table("videos").select("video_id,subject_tag").execute().data or []
            models = supabase.table("resources").select("resource_id,topics(subjects(subject_name))").in_("resource_type", ResourceService.MODEL_TYPES).execute().data or []
            recommendations = supabase.table("educator_recommendations").select("video_id,resource_id").execute().data or []
            events = supabase.table("learning_events").select("event_type,target_type,video_id,resource_id").execute().data or []
            rec_counts = Counter(row.get("video_id") or row.get("resource_id") for row in recommendations if row.get("video_id") or row.get("resource_id"))
            names = {row["video_id"]: row.get("subject_tag") or "Video" for row in videos}
            names.update({row["resource_id"]: ((row.get("topics") or {}).get("subjects") or {}).get("subject_name") or "3D Model" for row in models})
            subject_counts = Counter(row.get("subject_tag") or "Uncategorised" for row in videos)
            subject_counts.update(((row.get("topics") or {}).get("subjects") or {}).get("subject_name") or "Uncategorised" for row in models)
            view_events = {"opened", "video_played", "video_viewed", "model_viewed", "model_explored"}
            return {
                "total_internal_views": sum(1 for row in events if row.get("event_type") in view_events),
                "accounts": dict(Counter(row.get("role") for row in profiles)),
                "locked_accounts": sum(1 for row in profiles if row.get("locked_until")),
                "blacklisted_accounts": sum(1 for row in profiles if row.get("is_blacklisted")),
                "total_videos": len(videos), "total_models": len(models),
                "subject_distribution": [{"subject": name, "count": count} for name, count in subject_counts.most_common()],
                "most_recommended": [{"content_id": content_id, "label": names.get(content_id, "Resource"), "count": count} for content_id, count in rec_counts.most_common(8)],
            }
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Admin analytics could not be loaded.") from exc

    @classmethod
    def audit_logs(cls) -> list[dict]:
        try:
            return get_supabase().table("admin_audit_logs").select("*").order("created_at", desc=True).limit(100).execute().data or []
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Audit logs could not be loaded.") from exc
