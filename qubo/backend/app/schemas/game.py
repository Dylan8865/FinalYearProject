from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MatchResponse(BaseModel):
    match_id: UUID
    user_id: UUID
    winner: Optional[str] = None
    turns_played: int
    match_date: str


class MatchHistoryEventCreate(BaseModel):
    turn_number: int = Field(ge=1, le=10_000)
    effect_type: Optional[str] = Field(default=None, max_length=100)
    effect_value: Optional[int] = Field(default=None, ge=-1_000_000, le=1_000_000)
    corrupted_id: Optional[UUID] = None


class MatchHistoryBatchCreate(BaseModel):
    events: list[MatchHistoryEventCreate] = Field(min_length=1, max_length=1_000)


class MatchHistoryBatchResponse(BaseModel):
    saved_count: int


class MatchCompleteRequest(BaseModel):
    winner: str = Field(min_length=1, max_length=100)
    turns_played: int = Field(ge=0, le=10_000)
