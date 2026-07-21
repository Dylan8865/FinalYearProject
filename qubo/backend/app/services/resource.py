from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from typing import Dict, List, Optional

from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.services.recommendation import RecommendationExplanationService
from app.services.video import VideoService


class ResourceService:
    """Read-only 3D learning-resource queries with private Storage access."""

    STORAGE_BUCKET = "3d-models"
    SIGNED_URL_TTL_SECONDS = 900
    MODEL_SELECT = "resource_id,title,url,learning_style_tag,topics(topic_name,subjects(subject_name))"
    MODEL_TYPES = ["3d_model", "3D Model"]
    ANNOTATION_SELECT = "annotation_id,resource_id,title,description,position_x,position_y,position_z,created_by,created_at,updated_at"

    @classmethod
    def _serialize_model(cls, resource: dict, preview_model_url: Optional[str] = None) -> dict:
        topic = resource.get("topics") or {}
        subject = topic.get("subjects") or {}
        return {
            "resource_id": resource["resource_id"],
            "title": resource["title"],
            "subject_name": subject.get("subject_name"),
            "topic_name": topic.get("topic_name"),
            "learning_style_tag": resource.get("learning_style_tag"),
            "preview_model_url": preview_model_url,
        }

    @classmethod
    def _create_signed_model_url(cls, storage_path: str) -> str:
        return (
            get_supabase()
            .storage.from_(cls.STORAGE_BUCKET)
            .create_signed_url(storage_path, cls.SIGNED_URL_TTL_SECONDS)["signedURL"]
        )

    @classmethod
    def list_3d_models(cls) -> List[dict]:
        try:
            response = (
                get_supabase()
                .table("resources")
                .select(cls.MODEL_SELECT)
                .in_("resource_type", cls.MODEL_TYPES)
                .order("title")
                .execute()
            )
            return [
                cls._serialize_model(resource, cls._create_signed_model_url(resource["url"]))
                for resource in response.data or []
            ]
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="3D learning resources could not be loaded from Supabase.",
            ) from exc

    @classmethod
    def list_popular_3d_models(cls, limit: int = 3) -> List[dict]:
        models = cls.list_3d_models()
        try:
            since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
            events = get_supabase().table("learning_events").select(
                "user_id,resource_id,event_type"
            ).eq("target_type", "model").gte("occurred_at", since).execute().data or []
            meaningful_events = {"opened", "model_explored", "model_viewed", "saved", "completed"}
            unique_learners = {
                (row["resource_id"], row["user_id"])
                for row in events
                if row.get("resource_id") and row["event_type"] in meaningful_events
            }
            popularity = Counter(resource_id for resource_id, _user_id in unique_learners)
            ranked = [{**model, "popularity_count": popularity.get(model["resource_id"], 0)} for model in models]
            return sorted(ranked, key=lambda model: (-model["popularity_count"], model["title"].lower()))[:limit]
        except Exception:
            # Existing activity is a safe fallback while the event migration is
            # being deployed. It is one row per learner/content pair.
            try:
                since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
                activity = get_supabase().table("user_resources").select("resource_id").not_.is_("resource_id", "null").gte("last_viewed_at", since).execute().data or []
                popularity = Counter(row["resource_id"] for row in activity if row.get("resource_id"))
                ranked = [{**model, "popularity_count": popularity.get(model["resource_id"], 0)} for model in models]
                return sorted(ranked, key=lambda model: (-model["popularity_count"], model["title"].lower()))[:limit]
            except Exception:
                return [{**model, "popularity_count": 0} for model in models[:limit]]

    @classmethod
    def recommend_3d_model(cls, user_id: str) -> Optional[dict]:
        models = cls.list_3d_models()
        videos = VideoService.list_videos()
        if not models and not videos:
            return None
        try:
            viewed = get_supabase().table("user_resources").select("resource_id,video_id").eq("user_id", user_id).execute().data or []
            viewed_model_ids = {row["resource_id"] for row in viewed if row.get("resource_id")}
            viewed_video_ids = {row["video_id"] for row in viewed if row.get("video_id")}
            events = get_supabase().table("learning_events").select("event_type,metadata").eq("user_id", user_id).order("occurred_at", desc=True).limit(120).execute().data or []
            weights = {
                "saved": 4, "completed": 3, "quiz_completed": 3,
                "model_explored": 2, "model_viewed": 2, "video_progress": 2,
                "opened": 1, "video_played": 1, "skipped_quickly": -2,
            }
            subject_scores: defaultdict[str, float] = defaultdict(float)
            subject_event_counts: Counter = Counter()
            weak_quizzes: Dict[str, float] = {}
            for event in events:
                metadata = event.get("metadata") or {}
                subject = metadata.get("subject_name")
                if not subject:
                    continue
                key = (str(subject), event["event_type"])
                # Repeated refreshes or progress pings cannot dominate a topic.
                if subject_event_counts[key] >= 3:
                    continue
                subject_event_counts[key] += 1
                subject_scores[str(subject)] += weights.get(event["event_type"], 0)
                if event["event_type"] == "quiz_completed" and float(metadata.get("score_percent", 100)) < 60:
                    weak_quizzes[str(subject)] = min(weak_quizzes.get(str(subject), 100), float(metadata.get("score_percent", 100)))

            if weak_quizzes and videos:
                subject, score = min(weak_quizzes.items(), key=lambda item: item[1])
                candidates = [video for video in videos if video["video_id"] not in viewed_video_ids and video.get("subject_tag") == subject]
                candidates = candidates or [video for video in videos if video.get("subject_tag") == subject] or videos
                recommended = sorted(candidates, key=lambda video: video["title"].lower())[0]
                reason = f"Your latest {subject} quiz score was {score:.0f}%. Start with a focused explanation before practising again."
                return {
                    "target_type": "video", "target_id": recommended["video_id"], "title": recommended["title"],
                    "subject_name": recommended.get("subject_tag"), "reason": RecommendationExplanationService.explain(recommended["title"], subject, reason),
                    "learning_goal": f"Strengthen {subject} foundations before your next quiz.", "estimated_minutes": 6,
                    "youtube_url": recommended["youtube_url"],
                }

            candidates = [model for model in models if model["resource_id"] not in viewed_model_ids] or models
            recommended = max(candidates, key=lambda model: (subject_scores.get(model.get("subject_name") or "", 0), model["title"].lower()))
            subject = recommended.get("subject_name") or recommended.get("topic_name") or "this topic"
            if subject_scores.get(subject, 0) > 0:
                reason = f"Your recent learning activity shows interest in {subject}; this visual model is a useful next step."
            elif viewed:
                reason = "This is a new interactive model to broaden your current learning progress."
            else:
                reason = "This is a popular starting point for your learning library."
            return {
                "target_type": "model", "target_id": recommended["resource_id"], "title": recommended["title"],
                "subject_name": recommended.get("subject_name"), "topic_name": recommended.get("topic_name"),
                "reason": RecommendationExplanationService.explain(recommended["title"], subject, reason),
                "learning_goal": f"Explore {recommended.get('topic_name') or subject} visually and connect it to revision.",
                "estimated_minutes": 8, "preview_model_url": recommended["preview_model_url"],
            }
        except Exception:
            if models:
                model = models[0]
                return {"target_type": "model", "target_id": model["resource_id"], "title": model["title"], "subject_name": model.get("subject_name"), "topic_name": model.get("topic_name"), "reason": "This is a popular interactive model to explore next.", "learning_goal": "Build confidence with a visual revision activity.", "estimated_minutes": 8, "preview_model_url": model["preview_model_url"]}
            video = videos[0]
            return {"target_type": "video", "target_id": video["video_id"], "title": video["title"], "subject_name": video.get("subject_tag"), "reason": "Start with this focused video lesson.", "learning_goal": "Build a strong foundation for revision.", "estimated_minutes": 6, "youtube_url": video["youtube_url"]}

    @classmethod
    def get_3d_model(cls, resource_id: str) -> dict:
        try:
            response = (
                get_supabase()
                .table("resources")
                .select(cls.MODEL_SELECT)
                .eq("resource_id", resource_id)
                .in_("resource_type", cls.MODEL_TYPES)
                .maybe_single()
                .execute()
            )
            resource = response.data
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="3D learning resource could not be loaded from Supabase.",
            ) from exc

        if not resource:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="3D model not found.")

        try:
            signed_url = cls._create_signed_model_url(resource["url"])
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The private 3D model could not be prepared for viewing.",
            ) from exc

        return {
            **cls._serialize_model(resource, signed_url),
            "signed_model_url": signed_url,
        }

    @classmethod
    def list_educator_recommendations(cls, educator_id: Optional[str] = None) -> List[dict]:
        try:
            query = get_supabase().table("educator_recommendations").select(
                "recommendation_id,educator_id,resource_id,video_id,note,created_at,profiles(full_name,username)"
            ).order("created_at", desc=True)
            if educator_id:
                query = query.eq("educator_id", educator_id)
            recommendations = query.execute().data or []
            resource_ids = [row["resource_id"] for row in recommendations if row.get("resource_id")]
            video_ids = [row["video_id"] for row in recommendations if row.get("video_id")]
            models_by_id: Dict[str, dict] = {}
            videos_by_id: Dict[str, dict] = {}

            if resource_ids:
                resources = get_supabase().table("resources").select(cls.MODEL_SELECT).in_("resource_id", resource_ids).execute().data or []
                models_by_id = {
                    resource["resource_id"]: cls._serialize_model(resource, cls._create_signed_model_url(resource["url"]))
                    for resource in resources
                }
            if video_ids:
                videos = get_supabase().table("videos").select("video_id,title,subject_tag,youtube_url").in_("video_id", video_ids).execute().data or []
                videos_by_id = {video["video_id"]: video for video in videos}

            result = []
            for row in recommendations:
                profile = row.get("profiles") or {}
                educator_name = profile.get("full_name") or profile.get("username") or "Educator"
                if row.get("resource_id"):
                    model = models_by_id.get(row["resource_id"])
                    if model:
                        result.append({
                            "recommendation_id": row["recommendation_id"], "target_type": "model", "target_id": row["resource_id"],
                            "title": model["title"], "subject_name": model.get("subject_name"), "educator_id": row["educator_id"],
                            "educator_name": educator_name, "note": row["note"], "created_at": row["created_at"],
                            "preview_model_url": model["preview_model_url"],
                        })
                    continue
                video = videos_by_id.get(row.get("video_id"))
                if video:
                    result.append({
                        "recommendation_id": row["recommendation_id"], "target_type": "video", "target_id": row["video_id"],
                        "title": video["title"], "subject_name": video.get("subject_tag"), "educator_id": row["educator_id"],
                        "educator_name": educator_name, "note": row["note"], "created_at": row["created_at"],
                        "youtube_url": video["youtube_url"],
                    })
            return result
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Educator recommendations could not be loaded. Apply the educator recommendations migration first.") from exc

    @classmethod
    def create_educator_recommendation(cls, educator_id: str, target_type: str, target_id: str, note: str) -> dict:
        target_column = "resource_id" if target_type == "model" else "video_id"
        target_table = "resources" if target_type == "model" else "videos"
        try:
            target = get_supabase().table(target_table).select(target_column).eq(target_column, target_id).maybe_single().execute().data
            if not target:
                raise HTTPException(status_code=404, detail="Learning resource not found.")
            existing = get_supabase().table("educator_recommendations").select("recommendation_id").eq("educator_id", educator_id).eq(target_column, target_id).limit(1).execute().data or []
            if existing:
                raise HTTPException(status_code=409, detail="You have already recommended this item.")
            inserted = get_supabase().table("educator_recommendations").insert({
                "educator_id": educator_id, target_column: target_id, "note": note.strip(),
            }).execute().data or []
            if not inserted:
                raise HTTPException(status_code=502, detail="Recommendation could not be saved.")
            recommendation_id = inserted[0]["recommendation_id"]
            return next(item for item in cls.list_educator_recommendations(educator_id) if item["recommendation_id"] == recommendation_id)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Educator recommendation could not be saved. Apply the educator recommendations migration first.") from exc

    @classmethod
    def delete_educator_recommendation(cls, recommendation_id: str, educator_id: str) -> None:
        try:
            response = get_supabase().table("educator_recommendations").delete().eq("recommendation_id", recommendation_id).eq("educator_id", educator_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Recommendation not found or not owned by this educator.")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Educator recommendation could not be removed.") from exc

    @classmethod
    def _serialize_annotation(cls, annotation: dict) -> dict:
        return {
            "annotation_id": annotation["annotation_id"],
            "resource_id": annotation["resource_id"],
            "title": annotation["title"],
            "description": annotation["description"],
            "position": [
                float(annotation["position_x"]),
                float(annotation["position_y"]),
                float(annotation["position_z"]),
            ],
            "created_by": annotation["created_by"],
            "created_at": annotation["created_at"],
            "updated_at": annotation["updated_at"],
        }

    @classmethod
    def list_annotations(cls, resource_id: str) -> List[dict]:
        try:
            response = (
                get_supabase()
                .table("resource_annotations")
                .select(cls.ANNOTATION_SELECT)
                .eq("resource_id", resource_id)
                .order("created_at")
                .execute()
            )
            return [cls._serialize_annotation(annotation) for annotation in response.data or []]
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Model annotations could not be loaded from Supabase. Run database/resource_annotations.sql first.",
            ) from exc

    @classmethod
    def create_annotation(cls, resource_id: str, educator_id: str, annotation: dict) -> dict:
        try:
            response = (
                get_supabase()
                .table("resource_annotations")
                .insert({
                    "resource_id": resource_id,
                    "created_by": educator_id,
                    "title": annotation["title"],
                    "description": annotation["description"],
                    "position_x": annotation["position"][0],
                    "position_y": annotation["position"][1],
                    "position_z": annotation["position"][2],
                })
                .execute()
            )
            if response.data:
                return cls._serialize_annotation(response.data[0])
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Model annotation could not be saved in Supabase. Run database/resource_annotations.sql first.",
            ) from exc

        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Supabase did not return the saved annotation.")

    @classmethod
    def update_annotation(cls, annotation_id: str, educator_id: str, annotation: dict) -> dict:
        try:
            response = (
                get_supabase()
                .table("resource_annotations")
                .update({
                    "title": annotation["title"],
                    "description": annotation["description"],
                    "position_x": annotation["position"][0],
                    "position_y": annotation["position"][1],
                    "position_z": annotation["position"][2],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                })
                .eq("annotation_id", annotation_id)
                .eq("created_by", educator_id)
                .execute()
            )
            if response.data:
                return cls._serialize_annotation(response.data[0])
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Model annotation could not be updated in Supabase.",
            ) from exc

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotation not found or not owned by this educator.")

    @classmethod
    def delete_annotation(cls, annotation_id: str, educator_id: str) -> None:
        try:
            existing = (
                get_supabase()
                .table("resource_annotations")
                .select("annotation_id")
                .eq("annotation_id", annotation_id)
                .eq("created_by", educator_id)
                .maybe_single()
                .execute()
                .data
            )
            if not existing:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotation not found or not owned by this educator.")
            get_supabase().table("resource_annotations").delete().eq("annotation_id", annotation_id).execute()
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Model annotation could not be deleted in Supabase.",
            ) from exc
