from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class GameService:
    """Persist the small, web-facing summary of a Unity game session."""

    MATCH_COLUMNS = (
        "match_id,user_id,winner,turns_played,match_date,game_level,"
        "waves_cleared,is_victory,completed_at"
    )

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
        return cls.complete_match_with_progress(
            match_id, user_id, winner, turns_played, waves_cleared=0, is_victory=False
        )

    @classmethod
    def complete_match_with_progress(
        cls,
        match_id: str,
        user_id: str,
        winner: str,
        turns_played: int,
        waves_cleared: int,
        is_victory: bool,
    ) -> dict:
        cls._ensure_owned_match(match_id, user_id)
        try:
            response = (
                get_supabase()
                .table("matches")
                .update(
                    {
                        "winner": winner,
                        "turns_played": turns_played,
                        "waves_cleared": waves_cleared,
                        "is_victory": is_victory,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
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

    @classmethod
    def get_user_match_history(cls, user_id: str, limit: int) -> list[dict]:
        try:
            response = (
                get_supabase()
                .table("matches")
                .select(cls.MATCH_COLUMNS)
                .eq("user_id", user_id)
                .not_.is_("winner", "null")
                .order("match_date", desc=True)
                .limit(limit)
                .execute()
            )
            rows = response.data or []
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Your match history could not be loaded from Supabase.",
            ) from exc

        for row in rows:
            # `winner` is the source of truth for historical matches. The
            # is_victory column was introduced later, so older completed rows
            # have its default value even when the player won.
            row["result"] = "Win" if (row.get("winner") or "").casefold() == "player" else "Loss"
        return rows

    @classmethod
    def get_level_one_leaderboard(cls, limit: int) -> list[dict]:
        try:
            response = (
                get_supabase()
                .table("matches")
                .select("user_id,turns_played,match_date,completed_at,profiles!inner(username,profile_picture_url,role)")
                .ilike("winner", "player")
                .eq("profiles.role", "student")
                .order("turns_played")
                .order("match_date")
                .limit(limit * 20)
                .execute()
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The ChemBattle leaderboard could not be loaded from Supabase.",
            ) from exc

        # The ordered query means the first result for each student is their
        # best winning match. Do not expose email addresses or match history.
        entries: list[dict] = []
        seen_user_ids: set[str] = set()
        for row in response.data or []:
            user_id = row["user_id"]
            if user_id in seen_user_ids:
                continue
            seen_user_ids.add(user_id)
            profile = row.get("profiles") or {}
            if isinstance(profile, list):
                profile = profile[0] if profile else {}
            entries.append(
                {
                    "rank": len(entries) + 1,
                    "username": profile.get("username") or "Qubo student",
                    "profile_picture_url": profile.get("profile_picture_url"),
                    "turns_played": row["turns_played"],
                    "completed_at": row["completed_at"],
                    "played_at": row["completed_at"] or row["match_date"],
                }
            )
            if len(entries) == limit:
                break
        return entries
