from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


LearningTargetType = Literal["model", "video", "quiz"]
LearningEventType = Literal[
    "opened", "saved", "unsaved", "shared", "completed",
    "model_explored", "model_viewed", "video_played", "video_paused", "video_progress",
    "skipped_quickly", "rewound", "quiz_attempted", "quiz_completed",
]


class LearningEventCreate(BaseModel):
    target_type: LearningTargetType
    target_id: UUID | None = None
    event_type: LearningEventType
    session_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class CompletionRequest(BaseModel):
    target_type: Literal["model", "video"]
    target_id: UUID
    session_id: UUID | None = None


class CompletionStatusResponse(BaseModel):
    is_completed: bool


class EducatorAnalyticsResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    active_learners: int
    total_learning_events: int
    completions: int
    model_explorations: int
    video_learning_actions: int
    top_subjects: list[dict[str, int | str]]
    daily_activity: list[dict[str, int | str]]
