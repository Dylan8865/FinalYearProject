from uuid import UUID

from fastapi import APIRouter, Depends

from app.db.deps import get_current_user
from app.schemas.game import (
    MatchCompleteRequest,
    MatchHistoryBatchCreate,
    MatchHistoryBatchResponse,
    MatchResponse,
)
from app.services.game import GameService


router = APIRouter(prefix="/game/matches", tags=["game"])


@router.post("", response_model=MatchResponse, status_code=201)
async def create_match(current_user=Depends(get_current_user)):
    """Create a game session for the authenticated Qubo user."""
    return GameService.create_match(current_user["id"])


@router.post("/{match_id}/history", response_model=MatchHistoryBatchResponse)
async def save_match_history(
    match_id: UUID,
    payload: MatchHistoryBatchCreate,
    current_user=Depends(get_current_user),
):
    """Store Unity events in one completion-time batch."""
    saved_count = GameService.save_history(
        str(match_id),
        current_user["id"],
        [event.model_dump(exclude_none=True, mode="json") for event in payload.events],
    )
    return {"saved_count": saved_count}


@router.post("/{match_id}/complete", response_model=MatchResponse)
async def complete_match(
    match_id: UUID,
    payload: MatchCompleteRequest,
    current_user=Depends(get_current_user),
):
    """Save the final winner and number of turns for an owned game session."""
    return GameService.complete_match(
        str(match_id),
        current_user["id"],
        payload.winner,
        payload.turns_played,
    )
