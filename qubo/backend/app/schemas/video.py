from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class VideoResponse(BaseModel):
    """Student-safe tutorial video data returned by the API."""

    video_id: str
    youtube_url: str
    title: str
    subject_tag: Optional[str] = None


class VideoShareCreate(BaseModel):
    recipient_username: str = Field(min_length=1, max_length=100)
    message: Optional[str] = Field(default=None, max_length=300)


class SharedVideoResponse(VideoResponse):
    share_id: UUID
    sender_username: str
    message: Optional[str] = None
    shared_at: str
