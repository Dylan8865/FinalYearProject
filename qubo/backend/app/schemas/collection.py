from datetime import date
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EducatorVideoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    youtube_url: str = Field(min_length=8, max_length=500)
    subject_tag: Optional[str] = Field(default=None, max_length=100)


class CollectionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=1200)
    primary_subject_id: Optional[UUID] = None


class CollectionUpdate(CollectionCreate):
    pass


class CollectionItemCreate(BaseModel):
    item_type: Literal['video', 'model', 'quiz']
    target_id: UUID
    sort_order: int = Field(default=0, ge=0)


class CollectionShareCreate(BaseModel):
    student_ids: List[UUID] = Field(min_length=1, max_length=100)
    message: Optional[str] = Field(default=None, max_length=500)
    due_at: Optional[date] = None
