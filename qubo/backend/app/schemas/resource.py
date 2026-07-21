from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ThreeDModelSummaryResponse(BaseModel):
    resource_id: str
    title: str
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None
    learning_style_tag: Optional[str] = None
    preview_model_url: str
    popularity_count: int = 0


class ThreeDModelDetailResponse(ThreeDModelSummaryResponse):
    signed_model_url: str


class LearningRecommendationResponse(BaseModel):
    target_type: Literal["model", "video"]
    target_id: str
    title: str
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None
    reason: str
    learning_goal: str
    estimated_minutes: int
    preview_model_url: Optional[str] = None
    youtube_url: Optional[str] = None


class RecentLearningItemResponse(BaseModel):
    target_id: UUID
    target_type: str
    title: str
    subject_name: Optional[str] = None
    last_viewed_at: str
    view_count: int


class FavouriteTargetRequest(BaseModel):
    target_type: Literal["model", "video"]
    target_id: UUID


class FavouriteItemResponse(BaseModel):
    target_id: UUID
    target_type: Literal["model", "video"]
    title: str
    subject_name: Optional[str] = None
    date_added: str


class EducatorRecommendationCreate(BaseModel):
    target_type: Literal["model", "video"]
    target_id: UUID
    note: str = Field(min_length=1, max_length=300)


class EducatorRecommendationResponse(BaseModel):
    recommendation_id: UUID
    target_type: Literal["model", "video"]
    target_id: UUID
    title: str
    subject_name: Optional[str] = None
    educator_id: UUID
    educator_name: str
    note: str
    created_at: str
    preview_model_url: Optional[str] = None
    youtube_url: Optional[str] = None


class ModelAnnotationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=1200)
    position: List[float] = Field(min_length=3, max_length=3)


class ModelAnnotationUpdate(ModelAnnotationCreate):
    pass


class ModelAnnotationResponse(BaseModel):
    annotation_id: UUID
    resource_id: UUID
    title: str
    description: str
    position: List[float]
    created_by: UUID
    created_at: str
    updated_at: str
