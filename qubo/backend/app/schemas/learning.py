from typing import Any, Dict, List, Literal, Optional, Union
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
    target_id: Optional[UUID] = None
    event_type: LearningEventType
    session_id: Optional[UUID] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CompletionRequest(BaseModel):
    target_type: Literal["model", "video"]
    target_id: UUID
    session_id: Optional[UUID] = None


class CompletionStatusResponse(BaseModel):
    is_completed: bool


class StudentActivityAnalyticsResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    active_learners: int
    total_learning_events: int
    completions: int
    model_explorations: int
    video_learning_actions: int
    top_subjects: List[Dict[str, Union[int, str]]]
    daily_activity: List[Dict[str, Union[int, str]]]


class EducatorAnalyticsResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    active_learners: int
    total_learning_events: int
    completions: int
    model_explorations: int
    video_learning_actions: int
    top_subjects: List[Dict[str, Union[int, str]]]
    daily_activity: List[Dict[str, Union[int, str]]]
