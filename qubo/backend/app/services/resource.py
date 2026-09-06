from __future__ import annotations

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
    MODEL_SELECT = "resource_id,title,url,learning_style_tag,visibility,created_by,topics(topic_name,subjects(subject_name))"
    MODEL_TYPES = ["3d_model", "3D Model"]
    ANNOTATION_SELECT = "annotation_id,resource_id,title,description,position_x,position_y,position_z,created_by,created_at,updated_at"

    @classmethod
    def create_3d_model(cls, educator_id: str, title: str, subject_name: str, topic_name: Optional[str], visibility: str, content: bytes, content_type: str) -> dict:
        """Store a GLB privately, then create its resource record."""
        from uuid import uuid4

        supabase = get_supabase()
        try:
            subject_rows = (
                supabase.table('subjects')
                .select('id')
                .eq('subject_name', subject_name)
                .limit(1)
                .execute()
                .data
                or []
            )
            subject = subject_rows[0] if subject_rows else None
            if not subject:
                subject = supabase.table('subjects').insert({'subject_name': subject_name}).execute().data[0]
            topic_label = (topic_name or 'General').strip() or 'General'
            topic_rows = (
                supabase.table('topics')
                .select('id')
                .eq('subject_id', subject['id'])
                .eq('topic_name', topic_label)
                .limit(1)
                .execute()
                .data
                or []
            )
            topic = topic_rows[0] if topic_rows else None
            if not topic:
                topic = supabase.table('topics').insert({'subject_id': subject['id'], 'topic_name': topic_label}).execute().data[0]

            storage_path = f'{educator_id}/{uuid4()}.glb'
            supabase.storage.from_(cls.STORAGE_BUCKET).upload(storage_path, content, {'content-type': content_type, 'upsert': 'false'})
            created = supabase.table('resources').insert({
                'topic_id': topic['id'], 'title': title.strip(), 'url': storage_path,
                'resource_type': '3d_model', 'learning_style_tag': 'visual',
                'created_by': educator_id, 'visibility': visibility,
            }).execute().data
            if not created:
                supabase.storage.from_(cls.STORAGE_BUCKET).remove([storage_path])
                raise HTTPException(status_code=502, detail='The 3D model record could not be created.')
            from app.services.collection import CollectionService
            CollectionService.add_uploaded_item(educator_id, 'model', created[0]['resource_id'])
            return cls._serialize_model(created[0], cls._create_signed_model_url(storage_path))
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail='3D model upload failed. Check the 3d-models Storage bucket and database migration.') from exc

    @classmethod
    def delete_3d_model(cls, resource_id: str, educator_id: str) -> None:
        supabase = get_supabase()
        try:
            owned = supabase.table('resources').select('resource_id,url').eq('resource_id', resource_id).eq('created_by', educator_id).in_('resource_type', cls.MODEL_TYPES).limit(1).execute().data or []
            if not owned:
                raise HTTPException(status_code=404, detail='3D model not found or not owned by this educator.')
            storage_path = owned[0]['url']
            for table in ('resource_annotations', 'content_shares', 'educator_recommendations', 'user_favourites', 'user_resources', 'learning_events'):
                supabase.table(table).delete().eq('resource_id', resource_id).execute()
            deleted = supabase.table('resources').delete().eq('resource_id', resource_id).eq('created_by', educator_id).execute().data or []
            if not deleted:
                raise HTTPException(status_code=404, detail='3D model not found or not owned by this educator.')
            try:
                supabase.storage.from_(cls.STORAGE_BUCKET).remove([storage_path])
            except Exception:
                # The model record is already deleted; retain no broken UI if
                # a transient storage cleanup error occurs.
                pass
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail='3D model could not be deleted.') from exc

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
            "visibility": resource.get("visibility") or "public",
            "created_by": resource.get("created_by"),
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
    def list_3d_models(cls, viewer_id: Optional[str] = None, scope: str = 'public') -> List[dict]:
        try:
            query = (
                get_supabase()
                .table("resources")
                .select(cls.MODEL_SELECT + ",is_locked,is_deleted")
                .in_("resource_type", cls.MODEL_TYPES)
            )
            if scope == 'private':
                if not viewer_id:
                    return []
                # Educators see their own content including locked, but not soft-deleted
                query = query.eq('created_by', viewer_id).eq('is_deleted', False)
            else:
                # Students/public: hide both locked AND soft-deleted content
                query = query.eq('visibility', 'public').eq('is_locked', False).eq('is_deleted', False)
            response = query.order("title").execute()
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
    def list_popular_3d_models(cls, viewer_id: Optional[str] = None, limit: int = 3) -> List[dict]:
        models = cls.list_3d_models(viewer_id, 'public')
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
        models = cls.list_3d_models(user_id, 'public')
        videos = VideoService.list_videos()
        if not models and not videos:
            return None
        learning_style = "visual"
        try:
            supabase = get_supabase()
            profile_rows = (
                supabase.table("profiles")
                .select("learning_style")
                .eq("id", user_id)
                .limit(1)
                .execute()
                .data
                or []
            )
            saved_style = (profile_rows[0].get("learning_style") if profile_rows else "") or "visual"
            learning_style = str(saved_style).lower()
            if learning_style not in {"visual", "auditory", "kinesthetic"}:
                learning_style = "visual"

            viewed = supabase.table("user_resources").select("resource_id,video_id").eq("user_id", user_id).execute().data or []
            viewed_model_ids = {row["resource_id"] for row in viewed if row.get("resource_id")}
            viewed_video_ids = {row["video_id"] for row in viewed if row.get("video_id")}
            events = supabase.table("learning_events").select("event_type,metadata").eq("user_id", user_id).order("occurred_at", desc=True).limit(120).execute().data or []
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

            def pick_model(subject_name: Optional[str] = None) -> Optional[dict]:
                candidates = models
                style_tagged = [
                    model for model in candidates
                    if str(model.get("learning_style_tag") or "").lower() == learning_style
                ]
                if style_tagged:
                    candidates = style_tagged
                if subject_name:
                    matching_subject = [model for model in candidates if model.get("subject_name") == subject_name]
                    if matching_subject:
                        candidates = matching_subject
                unviewed = [model for model in candidates if model["resource_id"] not in viewed_model_ids]
                candidates = unviewed or candidates
                return max(
                    candidates,
                    key=lambda model: (subject_scores.get(model.get("subject_name") or "", 0), model["title"].lower()),
                ) if candidates else None

            def pick_video(subject_name: Optional[str] = None) -> Optional[dict]:
                candidates = videos
                if subject_name:
                    matching_subject = [video for video in candidates if video.get("subject_tag") == subject_name]
                    if matching_subject:
                        candidates = matching_subject
                unviewed = [video for video in candidates if video["video_id"] not in viewed_video_ids]
                candidates = unviewed or candidates
                return max(
                    candidates,
                    key=lambda video: (subject_scores.get(video.get("subject_tag") or "", 0), video["title"].lower()),
                ) if candidates else None

            def model_response(recommended: dict, reason: str) -> dict:
                subject_name = recommended.get("subject_name") or recommended.get("topic_name") or "this topic"
                if learning_style == "kinesthetic":
                    goal = f"Manipulate {recommended.get('topic_name') or subject_name}, then test yourself with practice questions."
                else:
                    goal = f"Explore {recommended.get('topic_name') or subject_name} visually and connect it to revision."
                return {
                    "target_type": "model", "target_id": recommended["resource_id"], "title": recommended["title"],
                    "subject_name": recommended.get("subject_name"), "topic_name": recommended.get("topic_name"),
                    "reason": RecommendationExplanationService.explain(recommended["title"], subject_name, reason),
                    "learning_goal": goal, "estimated_minutes": 8, "preview_model_url": recommended["preview_model_url"],
                }

            def video_response(recommended: dict, reason: str) -> dict:
                subject_name = recommended.get("subject_tag") or "this topic"
                return {
                    "target_type": "video", "target_id": recommended["video_id"], "title": recommended["title"],
                    "subject_name": recommended.get("subject_tag"),
                    "reason": RecommendationExplanationService.explain(recommended["title"], subject_name, reason),
                    "learning_goal": f"Watch the explanation for {subject_name}, then explain the key idea aloud in your own words.",
                    "estimated_minutes": 6, "youtube_url": recommended["youtube_url"],
                }

            if weak_quizzes:
                subject, score = min(weak_quizzes.items(), key=lambda item: item[1])
                if learning_style == "auditory":
                    recommended_video = pick_video(subject)
                    if recommended_video:
                        return video_response(
                            recommended_video,
                            f"Your latest {subject} quiz score was {score:.0f}%. Your auditory preference is matched with a focused explanation before you practise again.",
                        )
                else:
                    recommended_model = pick_model(subject)
                    if recommended_model:
                        action = "map the key relationships" if learning_style == "visual" else "explore it hands-on before practising"
                        return model_response(
                            recommended_model,
                            f"Your latest {subject} quiz score was {score:.0f}%. Use this interactive resource to {action} before your next attempt.",
                        )

                recommended_video = pick_video(subject)
                if recommended_video:
                    return video_response(
                        recommended_video,
                        f"Your latest {subject} quiz score was {score:.0f}%. Start with a focused explanation before practising again.",
                    )

            if learning_style == "auditory":
                recommended_video = pick_video()
                if recommended_video:
                    subject = recommended_video.get("subject_tag") or "this topic"
                    if subject_scores.get(subject, 0) > 0:
                        reason = f"Your recent learning activity shows interest in {subject}; this explanation matches your auditory preference."
                    else:
                        reason = "This focused explanation matches your auditory learning preference."
                    return video_response(recommended_video, reason)

            recommended_model = pick_model()
            if recommended_model:
                subject = recommended_model.get("subject_name") or recommended_model.get("topic_name") or "this topic"
                if subject_scores.get(subject, 0) > 0:
                    reason = f"Your recent learning activity shows interest in {subject}; this interactive resource matches your {learning_style} preference."
                elif viewed:
                    reason = f"This is a new interactive resource matched to your {learning_style} preference."
                else:
                    reason = f"This is a useful starting resource matched to your {learning_style} preference."
                return model_response(recommended_model, reason)

            recommended_video = pick_video()
            if recommended_video:
                return video_response(recommended_video, "Start with this focused video lesson before choosing your next practice activity.")
            return None
        except Exception:
            if learning_style == "auditory" and videos:
                video = videos[0]
                return {"target_type": "video", "target_id": video["video_id"], "title": video["title"], "subject_name": video.get("subject_tag"), "reason": "Start with this focused video lesson matched to your auditory preference.", "learning_goal": "Build a strong foundation by listening, then explaining the main idea aloud.", "estimated_minutes": 6, "youtube_url": video["youtube_url"]}
            if models:
                model = models[0]
                goal = "Use the model hands-on, then test yourself with practice questions." if learning_style == "kinesthetic" else "Build confidence with a visual revision activity."
                return {"target_type": "model", "target_id": model["resource_id"], "title": model["title"], "subject_name": model.get("subject_name"), "topic_name": model.get("topic_name"), "reason": f"This interactive model is a useful next step for your {learning_style} preference.", "learning_goal": goal, "estimated_minutes": 8, "preview_model_url": model["preview_model_url"]}
            video = videos[0]
            return {"target_type": "video", "target_id": video["video_id"], "title": video["title"], "subject_name": video.get("subject_tag"), "reason": "Start with this focused video lesson.", "learning_goal": "Build a strong foundation for revision.", "estimated_minutes": 6, "youtube_url": video["youtube_url"]}

    @classmethod
    def get_3d_model(cls, resource_id: str, viewer_id: str, viewer_role: str = 'student') -> dict:
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

        if not resource or (viewer_role != 'admin' and resource.get('visibility') == 'private' and resource.get('created_by') != viewer_id):
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
            "can_manage_annotations": resource.get("created_by") == viewer_id,
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
        from app.services.moderation import AIModerationService
        scan = AIModerationService.scan_multiple(annotation.get("title"), annotation.get("description"))
        try:
            model = (
                get_supabase()
                .table("resources")
                .select("resource_id")
                .eq("resource_id", resource_id)
                .in_("resource_type", cls.MODEL_TYPES)
                .eq("created_by", educator_id)
                .limit(1)
                .execute()
                .data
                or []
            )
            if not model:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the educator who uploaded this 3D model can add annotations.",
                )
            # If AI flagged the annotation text, lock the parent model
            if not scan["is_safe"]:
                get_supabase().table("resources").update({
                    "is_locked": True,
                    "locked_reason": scan["flag_reason"],
                }).eq("resource_id", resource_id).execute()
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
                result = cls._serialize_annotation(response.data[0])
                result["ai_flagged"] = not scan["is_safe"]
                return result
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
