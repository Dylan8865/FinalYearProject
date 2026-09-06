from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class VideoResponse(BaseModel):
    """Student-safe tutorial video data returned by the API."""

    video_id: str
    youtube_url: str
    title: str
    subject_tag: Optional[str] = None
    uploaded_by: Optional[str] = None
    is_locked: bool = False
    is_deleted: bool = False


class ContentShareCreate(BaseModel):
    recipient_email: EmailStr
    message: Optional[str] = Field(default=None, max_length=300)


class SharedContentResponse(BaseModel):
    share_id: UUID
    target_type: Literal["model", "video"]
    target_id: UUID
    title: str
    subject_name: Optional[str] = None
    sender_email: str
    message: Optional[str] = None
    shared_at: str
