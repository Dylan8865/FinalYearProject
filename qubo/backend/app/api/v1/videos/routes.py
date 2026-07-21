from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Response, status

from app.db.deps import get_current_educator, get_current_user
from app.schemas.collection import EducatorVideoCreate
from app.schemas.video import ContentShareCreate, SharedContentResponse, VideoResponse
from app.services.activity import ActivityService
from app.services.share import ContentShareService
from app.services.video import VideoService
from app.services.learning import LearningService


router = APIRouter(prefix="/videos", tags=["videos"])


@router.post('', response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(payload: EducatorVideoCreate, current_user=Depends(get_current_educator)):
    return VideoService.create_video(current_user['id'], payload.title, payload.youtube_url, payload.subject_tag)


@router.get("", response_model=List[VideoResponse])
async def list_videos(
    search: Optional[str] = Query(default=None, max_length=100),
    subject: Optional[str] = Query(default=None, max_length=100),
    _current_user=Depends(get_current_user),
):
    """List tutorial videos alphabetically without exposing uploader identity."""
    return VideoService.list_videos(search=search, subject=subject)


@router.post("/{video_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def record_video_view(video_id: str, current_user=Depends(get_current_user)):
    """Record a play/open action for recent-learning and analytics features."""
    VideoService.ensure_video_exists(video_id)
    ActivityService.record_video_view(current_user["id"], video_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{video_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def share_video(video_id: str, payload: ContentShareCreate, current_user=Depends(get_current_user)):
    ContentShareService.share("video", video_id, current_user["id"], str(payload.recipient_email), payload.message)
    LearningService.record(current_user["id"], {
        "target_type": "video", "target_id": video_id, "event_type": "shared",
        "metadata": {"source": "in_app_share"},
    })
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/shared/with-me", response_model=List[SharedContentResponse])
async def list_shared_videos(current_user=Depends(get_current_user)):
    return ContentShareService.list_received(current_user["id"])


@router.post("/shared/with-me/{share_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_shared_video(share_id: str, current_user=Depends(get_current_user)):
    ContentShareService.set_dismissed(share_id, current_user["id"], dismissed=True)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/shared/with-me/{share_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_shared_video(share_id: str, current_user=Depends(get_current_user)):
    ContentShareService.set_dismissed(share_id, current_user["id"], dismissed=False)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
