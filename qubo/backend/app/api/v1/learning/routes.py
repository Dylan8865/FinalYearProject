from fastapi import APIRouter, Depends, Response, status

from app.db.deps import get_current_educator, get_current_user
from app.schemas.learning import CompletionRequest, CompletionStatusResponse, EducatorAnalyticsResponse, LearningEventCreate
from app.services.learning import LearningService
from app.services.activity import ActivityService


router = APIRouter(prefix="/learning", tags=["learning"])


@router.post("/events", status_code=status.HTTP_204_NO_CONTENT)
async def record_learning_event(payload: LearningEventCreate, current_user=Depends(get_current_user)):
    LearningService.record(current_user["id"], payload.model_dump())
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/completion", status_code=status.HTTP_204_NO_CONTENT)
async def mark_completed(payload: CompletionRequest, current_user=Depends(get_current_user)):
    LearningService.mark_completed(current_user["id"], payload.target_type, str(payload.target_id), str(payload.session_id) if payload.session_id else None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/completion/{target_type}/{target_id}", response_model=CompletionStatusResponse)
async def get_completion_status(target_type: str, target_id: str, current_user=Depends(get_current_user)):
    if target_type not in {"model", "video"}:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    return LearningService.completion_status(current_user["id"], target_type, target_id)


@router.delete("/recent/{target_type}/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_recent_learning(target_type: str, target_id: str, current_user=Depends(get_current_user)):
    if target_type not in {"model", "video"}:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    ActivityService.remove_recent_item(current_user["id"], target_type, target_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/recent/{target_type}/{target_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_recent_learning(target_type: str, target_id: str, current_user=Depends(get_current_user)):
    if target_type == "model":
        ActivityService.record_resource_view(current_user["id"], target_id)
    elif target_type == "video":
        ActivityService.record_video_view(current_user["id"], target_id)
    else:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/analytics", response_model=EducatorAnalyticsResponse)
async def get_educator_analytics(_current_user=Depends(get_current_educator)):
    return LearningService.educator_analytics()
