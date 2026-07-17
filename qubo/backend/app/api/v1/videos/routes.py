from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Response, status

from app.db.deps import get_current_user
from app.schemas.video import SharedVideoResponse, VideoResponse, VideoShareCreate
from app.services.activity import ActivityService
from app.services.share import VideoShareService
from app.services.video import VideoService
from app.services.learning import LearningService


router = APIRouter(prefix="/videos", tags=["videos"])


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
async def share_video(video_id: str, payload: VideoShareCreate, current_user=Depends(get_current_user)):
    VideoShareService.share(video_id, current_user["id"], payload.recipient_username, payload.message)
    LearningService.record(current_user["id"], {
        "target_type": "video", "target_id": video_id, "event_type": "shared",
        "metadata": {"source": "in_app_share"},
    })
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/shared/with-me", response_model=List[SharedVideoResponse])
async def list_shared_videos(current_user=Depends(get_current_user)):
    return VideoShareService.list_received(current_user["id"])
