from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class GameService:
    """Persist the small, web-facing summary of a Unity game session."""

    MATCH_COLUMNS = "match_id,user_id,winner,turns_played,match_date"

    @classmethod
    def create_match(cls, user_id: str) -> dict:
        try:
            response = (
                get_supabase()
                .table("matches")
                .insert({"user_id": user_id, "turns_played": 0})
                .execute()
            )
            if response.data:
                return response.data[0]
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The match could not be created in Supabase.",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase did not return the created match.",
        )

    @classmethod
    def _ensure_owned_match(cls, match_id: str, user_id: str) -> None:
        try:
            match = (
                get_supabase()
                .table("matches")
                .select("match_id")
                .eq("match_id", match_id)
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
                .data
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The match could not be checked in Supabase.",
            ) from exc

        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    @classmethod
    def save_history(cls, match_id: str, user_id: str, events: list[dict]) -> int:
        cls._ensure_owned_match(match_id, user_id)
        rows = [{"match_id": match_id, **event} for event in events]
        try:
            get_supabase().table("match_history").insert(rows).execute()
            return len(rows)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The match history could not be saved in Supabase.",
            ) from exc

    @classmethod
    def complete_match(cls, match_id: str, user_id: str, winner: str, turns_played: int) -> dict:
        cls._ensure_owned_match(match_id, user_id)
        try:
            response = (
                get_supabase()
                .table("matches")
                .update({"winner": winner, "turns_played": turns_played})
                .eq("match_id", match_id)
                .eq("user_id", user_id)
                .execute()
            )
            if response.data:
                return response.data[0]
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The match result could not be saved in Supabase.",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase did not return the completed match.",
        )
