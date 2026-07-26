from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MatchResponse(BaseModel):
    match_id: UUID
    user_id: UUID
    winner: Optional[str] = None
    turns_played: int
    match_date: str
    game_level: int = 1
    waves_cleared: int = 0
    is_victory: bool = False
    score: Optional[int] = None
    enemies_defeated: Optional[int] = None
    compounds_discovered: Optional[int] = None
    highest_combo: Optional[int] = None
    leaderboard_points: Optional[int] = None
    completed_at: Optional[str] = None


class MatchHistoryResponse(MatchResponse):
    result: str


class LeaderboardEntryResponse(BaseModel):
    rank: int
    match_id: UUID
    username: str
    profile_picture_url: Optional[str] = None
    score: int
    leaderboard_points: int
    waves_cleared: int
    enemies_defeated: int
    compounds_discovered: int
    highest_combo: int
    grade: str
    turns_played: int
    completed_at: Optional[str] = None
    played_at: str


class MatchHistoryEventCreate(BaseModel):
    turn_number: int = Field(ge=1, le=10_000)
    effect_type: Optional[str] = Field(default=None, max_length=100)
    effect_value: Optional[int] = Field(default=None, ge=-1_000_000, le=1_000_000)
    corrupted_id: Optional[UUID] = None


class MatchHistoryBatchCreate(BaseModel):
    events: List[MatchHistoryEventCreate] = Field(min_length=1, max_length=1_000)


class MatchHistoryBatchResponse(BaseModel):
    saved_count: int


class MatchCompleteRequest(BaseModel):
    winner: str = Field(min_length=1, max_length=100)
    turns_played: int = Field(ge=0, le=10_000)
    waves_cleared: int = Field(default=0, ge=0, le=100)
    is_victory: bool = False
    score: Optional[int] = Field(default=None, ge=0, le=10_000_000)
    enemies_defeated: Optional[int] = Field(default=None, ge=0, le=100_000)
    compounds_discovered: Optional[int] = Field(default=None, ge=0, le=100_000)
    highest_combo: Optional[int] = Field(default=None, ge=0, le=100_000)
