from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app.db.deps import get_current_educator, get_current_user
from app.schemas.resource import (
    ModelAnnotationCreate,
    ModelAnnotationResponse,
    ModelAnnotationUpdate,
    FavouriteItemResponse,
    FavouriteTargetRequest,
    EducatorRecommendationCreate,
    EducatorRecommendationResponse,
    RecentLearningItemResponse,
    LearningRecommendationResponse,
    ThreeDModelDetailResponse,
    ThreeDModelSummaryResponse,
)
from app.schemas.video import ContentShareCreate
from app.services.activity import ActivityService
from app.services.favourite import FavouriteService
from app.services.resource import ResourceService
from app.services.learning import LearningService
from app.services.share import ContentShareService


router = APIRouter(prefix="/resources", tags=["resources"])

MAX_GLB_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_GLB_TYPES = {'model/gltf-binary', 'application/octet-stream'}


@router.post('/models', response_model=ThreeDModelSummaryResponse, status_code=status.HTTP_201_CREATED)
async def upload_3d_model(
    title: str = Form(...),
    subject_name: str = Form(...),
    topic_name: str | None = Form(default=None),
    visibility: str = Form(default='public'),
    model: UploadFile = File(...),
    current_user=Depends(get_current_educator),
):
    if model.content_type not in ALLOWED_GLB_TYPES and not (model.filename or '').lower().endswith('.glb'):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail='3D models must be uploaded as a .glb file.')
    content = await model.read(MAX_GLB_FILE_SIZE + 1)
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='The selected model is empty.')
    if len(content) > MAX_GLB_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='3D models must be 50 MB or smaller.')
    if visibility not in {'public', 'private'}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Visibility must be public or private.')
    return await run_in_threadpool(ResourceService.create_3d_model, current_user['id'], title, subject_name, topic_name, visibility, content, model.content_type or 'model/gltf-binary')


@router.get("/models", response_model=List[ThreeDModelSummaryResponse])
async def list_3d_models(scope: str = 'public', current_user=Depends(get_current_user)):
    """List 3D learning resources without exposing their private Storage paths."""
    if scope not in {'public', 'private'}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Scope must be public or private.')
    if scope == 'private' and current_user['role'] != 'educator':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only educators can view private models.')
    return ResourceService.list_3d_models(current_user['id'], scope)


@router.get("/models/popular", response_model=List[ThreeDModelSummaryResponse])
async def list_popular_3d_models(current_user=Depends(get_current_user)):
    return ResourceService.list_popular_3d_models(current_user['id'])


@router.get("/recommendation", response_model=Optional[LearningRecommendationResponse])
async def get_recommendation(current_user=Depends(get_current_user)):
    return ResourceService.recommend_3d_model(current_user["id"])


@router.get("/educator-picks", response_model=List[EducatorRecommendationResponse])
async def list_educator_picks(_current_user=Depends(get_current_user)):
    return ResourceService.list_educator_recommendations()


@router.get("/educator-picks/mine", response_model=List[EducatorRecommendationResponse])
async def list_my_educator_picks(current_user=Depends(get_current_educator)):
    return ResourceService.list_educator_recommendations(current_user["id"])


@router.post("/educator-picks", response_model=EducatorRecommendationResponse, status_code=201)
async def create_educator_pick(payload: EducatorRecommendationCreate, current_user=Depends(get_current_educator)):
    return ResourceService.create_educator_recommendation(
        current_user["id"], payload.target_type, str(payload.target_id), payload.note
    )


@router.delete("/educator-picks/{recommendation_id}", status_code=204)
async def delete_educator_pick(recommendation_id: str, current_user=Depends(get_current_educator)):
    ResourceService.delete_educator_recommendation(recommendation_id, current_user["id"])
    return Response(status_code=204)


@router.get("/recent", response_model=List[RecentLearningItemResponse])
async def list_recent_learning(current_user=Depends(get_current_user)):
    """Return the student's latest viewed resources and tutorial videos."""
    return ActivityService.list_recent_learning(current_user["id"])


@router.get("/favourites", response_model=List[FavouriteItemResponse])
async def list_favourites(current_user=Depends(get_current_user)):
    return FavouriteService.list_for_user(current_user["id"])


@router.post("/favourites", status_code=status.HTTP_204_NO_CONTENT)
async def save_favourite(payload: FavouriteTargetRequest, current_user=Depends(get_current_user)):
    FavouriteService.save(current_user["id"], payload.target_type, str(payload.target_id))
    LearningService.record(current_user["id"], {
        "target_type": payload.target_type, "target_id": str(payload.target_id),
        "event_type": "saved", "metadata": {},
    })
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/favourites/{target_type}/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favourite(target_type: str, target_id: str, current_user=Depends(get_current_user)):
    if target_type not in {"model", "video"}:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    FavouriteService.remove(current_user["id"], target_type, target_id)
    LearningService.record(current_user["id"], {
        "target_type": target_type, "target_id": target_id,
        "event_type": "unsaved", "metadata": {},
    })
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/models/{resource_id}", response_model=ThreeDModelDetailResponse)
async def get_3d_model(resource_id: str, current_user=Depends(get_current_user)):
    """Return a short-lived signed URL for one private GLB resource."""
    model = ResourceService.get_3d_model(resource_id, current_user['id'])
    ActivityService.record_resource_view(current_user["id"], resource_id)
    return model


@router.post("/models/{resource_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def share_3d_model(resource_id: str, payload: ContentShareCreate, current_user=Depends(get_current_user)):
    ContentShareService.share("model", resource_id, current_user["id"], str(payload.recipient_email), payload.message)
    LearningService.record(current_user["id"], {
        "target_type": "model", "target_id": resource_id, "event_type": "shared",
        "metadata": {"source": "in_app_share"},
    })
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/models/{resource_id}/annotations", response_model=List[ModelAnnotationResponse])
async def list_model_annotations(resource_id: str, _current_user=Depends(get_current_user)):
    """Return the learning hotspots shown to students and educators."""
    return ResourceService.list_annotations(resource_id)


@router.post("/models/{resource_id}/annotations", response_model=ModelAnnotationResponse, status_code=201)
async def create_model_annotation(
    resource_id: str,
    payload: ModelAnnotationCreate,
    current_user=Depends(get_current_educator),
):
    """Allow an educator to place a labelled hotspot on a model."""
    return ResourceService.create_annotation(resource_id, current_user["id"], payload.model_dump())


@router.put("/models/annotations/{annotation_id}", response_model=ModelAnnotationResponse)
async def update_model_annotation(
    annotation_id: str,
    payload: ModelAnnotationUpdate,
    current_user=Depends(get_current_educator),
):
    return ResourceService.update_annotation(annotation_id, current_user["id"], payload.model_dump())


@router.delete("/models/annotations/{annotation_id}", status_code=204)
async def delete_model_annotation(annotation_id: str, current_user=Depends(get_current_educator)):
    ResourceService.delete_annotation(annotation_id, current_user["id"])
