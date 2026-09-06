"""Student-facing service for receiving shared collections from educators."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.services.resource import ResourceService


class CollectionInboxService:
    """Read shared collections that educators have distributed to a student."""

    @classmethod
    def list_received(cls, student_id: str) -> List[dict]:
        """Return every non-dismissed collection shared with *student_id*."""
        supabase = get_supabase()
        try:
            shares = (
                supabase.table("collection_shares")
                .select(
                    "collection_share_id,collection_id,shared_by,message,due_at,"
                    "shared_at,opened_at"
                )
                .eq("student_id", student_id)
                .order("shared_at", desc=True)
                .execute()
                .data
                or []
            )
            if not shares:
                return []

            collection_ids = list({s["collection_id"] for s in shares})
            educator_ids = list({s["shared_by"] for s in shares})

            # Fetch collection metadata
            collections = {
                c["collection_id"]: c
                for c in supabase.table("collections")
                .select("collection_id,title,description,status")
                .in_("collection_id", collection_ids)
                .execute()
                .data
                or []
            }

            # Fetch educator names
            educators = {
                e["id"]: e
                for e in supabase.table("profiles")
                .select("id,full_name,email")
                .in_("id", educator_ids)
                .execute()
                .data
                or []
            }

            # Fetch item counts and type summaries per collection
            items = (
                supabase.table("collection_items")
                .select("collection_id,item_type")
                .in_("collection_id", collection_ids)
                .execute()
                .data
                or []
            )
            item_summary: Dict[str, dict] = {}
            for item in items:
                cid = item["collection_id"]
                summary = item_summary.setdefault(cid, {"total": 0, "types": set()})
                summary["total"] += 1
                summary["types"].add(item["item_type"])

            result = []
            for share in shares:
                collection = collections.get(share["collection_id"])
                if not collection:
                    continue
                educator = educators.get(share["shared_by"], {})
                summary = item_summary.get(share["collection_id"], {"total": 0, "types": set()})
                result.append(
                    {
                        "collection_share_id": share["collection_share_id"],
                        "collection_id": share["collection_id"],
                        "title": collection.get("title", "Untitled collection"),
                        "description": collection.get("description"),
                        "educator_name": educator.get("full_name") or educator.get("email") or "Educator",
                        "educator_email": educator.get("email"),
                        "message": share.get("message"),
                        "due_at": share.get("due_at"),
                        "shared_at": share["shared_at"],
                        "opened_at": share.get("opened_at"),
                        "item_count": summary["total"],
                        "content_types": sorted(summary["types"]),
                    }
                )
            return result
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Shared collections could not be loaded.",
            ) from exc

    @classmethod
    def get_detail(cls, student_id: str, collection_id: str) -> dict:
        """Return full collection detail with all resolved items."""
        supabase = get_supabase()
        try:
            # Verify student has access
            share_rows = (
                supabase.table("collection_shares")
                .select("collection_share_id,shared_by,message,due_at,shared_at,opened_at")
                .eq("student_id", student_id)
                .eq("collection_id", collection_id)
                .limit(1)
                .execute()
                .data
                or []
            )
            if not share_rows:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="This collection has not been shared with you.",
                )
            share = share_rows[0]

            # Auto-mark as opened on first view
            if not share.get("opened_at"):
                supabase.table("collection_shares").update(
                    {"opened_at": datetime.now(timezone.utc).isoformat()}
                ).eq(
                    "collection_share_id", share["collection_share_id"]
                ).execute()

            # Fetch collection
            collection_rows = (
                supabase.table("collections")
                .select("collection_id,title,description")
                .eq("collection_id", collection_id)
                .limit(1)
                .execute()
                .data
                or []
            )
            if not collection_rows:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Collection not found.",
                )
            collection = collection_rows[0]

            # Fetch educator info
            educator_rows = (
                supabase.table("profiles")
                .select("id,full_name,email")
                .eq("id", share["shared_by"])
                .limit(1)
                .execute()
                .data
                or []
            )
            educator = educator_rows[0] if educator_rows else {}

            # Fetch all items
            item_rows = (
                supabase.table("collection_items")
                .select("collection_item_id,item_type,video_id,resource_id,quiz_id,sort_order")
                .eq("collection_id", collection_id)
                .order("sort_order")
                .execute()
                .data
                or []
            )

            placeholder_id = "00000000-0000-0000-0000-000000000000"

            model_ids = [i["resource_id"] for i in item_rows if i.get("resource_id")]
            video_ids = [i["video_id"] for i in item_rows if i.get("video_id")]
            quiz_ids = [i["quiz_id"] for i in item_rows if i.get("quiz_id")]

            models = {
                m["resource_id"]: m
                for m in supabase.table("resources")
                .select("resource_id,title,url,topics(topic_name,subjects(subject_name))")
                .in_("resource_id", model_ids or [placeholder_id])
                .eq('is_locked', False).eq('is_deleted', False)
                .execute()
                .data
                or []
            }
            videos = {
                v["video_id"]: v
                for v in supabase.table("videos")
                .select("video_id,title,youtube_url,subject_tag")
                .in_("video_id", video_ids or [placeholder_id])
                .eq('is_locked', False).eq('is_deleted', False)
                .execute()
                .data
                or []
            }
            quizzes = {
                q["id"]: q
                for q in supabase.table("quizzes")
                .select("id,title,subjects(subject_name)")
                .in_("id", quiz_ids or [placeholder_id])
                .execute()
                .data
                or []
            }

            resolved_items = []
            for item in item_rows:
                item_type = item["item_type"]
                target_id = item.get("resource_id") or item.get("video_id") or item.get("quiz_id")
                source = (
                    models.get(target_id)
                    or videos.get(target_id)
                    or quizzes.get(target_id)
                    or {}
                )
                topic = source.get("topics") or {}
                subject = topic.get("subjects") or source.get("subjects") or {}

                entry: dict = {
                    "collection_item_id": item["collection_item_id"],
                    "item_type": item_type,
                    "target_id": target_id,
                    "title": source.get("title", "Unavailable item"),
                    "subject_name": (
                        source.get("subject_tag")
                        or subject.get("subject_name")
                        or topic.get("topic_name")
                    ),
                    "sort_order": item["sort_order"],
                }

                # Add type-specific fields
                if item_type == "video":
                    entry["youtube_url"] = source.get("youtube_url")
                elif item_type == "model":
                    try:
                        entry["model_url"] = ResourceService._create_signed_model_url(source["url"])
                    except Exception:
                        entry["model_url"] = None

                resolved_items.append(entry)

            return {
                "collection_id": collection["collection_id"],
                "title": collection["title"],
                "description": collection.get("description"),
                "educator_name": educator.get("full_name") or educator.get("email") or "Educator",
                "educator_email": educator.get("email"),
                "message": share.get("message"),
                "due_at": share.get("due_at"),
                "shared_at": share["shared_at"],
                "items": resolved_items,
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Collection detail could not be loaded.",
            ) from exc

    @staticmethod
    def mark_opened(student_id: str, collection_share_id: str) -> None:
        try:
            result = (
                get_supabase()
                .table("collection_shares")
                .update({"opened_at": datetime.now(timezone.utc).isoformat()})
                .eq("collection_share_id", collection_share_id)
                .eq("student_id", student_id)
                .execute()
            )
            if not result.data:
                raise HTTPException(status_code=404, detail="Shared collection not found.")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Could not mark collection as opened.") from exc

    @staticmethod
    def save_quiz_to_library(student_id: str, quiz_id: str, collection_id: str) -> dict:
        """Copy a shared quiz into the student's personal quiz library."""
        supabase = get_supabase()
        try:
            # Verify student has access to this collection
            access = (
                supabase.table("collection_shares")
                .select("collection_share_id")
                .eq("student_id", student_id)
                .eq("collection_id", collection_id)
                .limit(1)
                .execute()
                .data
                or []
            )
            if not access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this collection.",
                )

            # Verify the quiz is in this collection
            item_check = (
                supabase.table("collection_items")
                .select("collection_item_id")
                .eq("collection_id", collection_id)
                .eq("quiz_id", quiz_id)
                .limit(1)
                .execute()
                .data
                or []
            )
            if not item_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Quiz not found in this collection.",
                )

            # Fetch the original quiz data
            quiz_rows = (
                supabase.table("quizzes")
                .select("*")
                .eq("id", quiz_id)
                .limit(1)
                .execute()
                .data
                or []
            )
            if not quiz_rows:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Original quiz not found.",
                )
            original = quiz_rows[0]

            # Check if student already has a copy of this exact quiz (by title + source)
            existing = (
                supabase.table("quizzes")
                .select("id")
                .eq("owner_id", student_id)
                .eq("title", original["title"])
                .eq("source_type", "educator_shared")
                .limit(1)
                .execute()
                .data
                or []
            )
            if existing:
                return {"id": existing[0]["id"], "message": "Quiz already saved to your library."}

            # Create a copy for the student
            copy_data = {
                "owner_id": student_id,
                "title": original["title"],
                "subject_id": original.get("subject_id"),
                "source_type": "educator_shared",
                "quiz_data": original.get("quiz_data"),
            }
            # Include topic_id if the original has one
            if original.get("topic_id"):
                copy_data["topic_id"] = original["topic_id"]
            created = supabase.table("quizzes").insert(copy_data).execute().data
            if not created:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Quiz could not be saved.",
                )
            return {"id": created[0]["id"], "message": "Quiz saved to your library."}
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Quiz could not be saved to your library.",
            ) from exc

