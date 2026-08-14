from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class GameService:
    """Persist the small, web-facing summary of a Unity game session."""

    MATCH_COLUMNS = (
        "match_id,user_id,winner,turns_played,match_date,game_level,"
        "waves_cleared,is_victory,score,enemies_defeated,compounds_discovered,"
        "highest_combo,leaderboard_points,completed_at"
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
    def save_history(cls, match_id: str, user_id: str, events: List[dict]) -> int:
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
        score: Optional[int] = None,
        enemies_defeated: Optional[int] = None,
        compounds_discovered: Optional[int] = None,
        highest_combo: Optional[int] = None,
    ) -> dict:
        cls._ensure_owned_match(match_id, user_id)
        try:
            update_values = {
                "winner": winner,
                "turns_played": turns_played,
                "waves_cleared": waves_cleared,
                "is_victory": is_victory,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
            if score is not None:
                update_values["score"] = score
            if enemies_defeated is not None:
                update_values["enemies_defeated"] = enemies_defeated
            if compounds_discovered is not None:
                update_values["compounds_discovered"] = compounds_discovered
            if highest_combo is not None:
                update_values["highest_combo"] = highest_combo

            response = (
                get_supabase()
                .table("matches")
                .update(update_values)
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
    def get_user_match_history(cls, user_id: str, limit: int) -> List[dict]:
        try:
            response = (
                get_supabase()
                .table("matches")
                .select(cls.MATCH_COLUMNS)
                .eq("user_id", user_id)
                .not_.is_("winner", "null")
                .order("completed_at", desc=True)
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
    def get_level_one_leaderboard(cls, limit: int) -> List[dict]:
        try:
            response = (
                get_supabase()
                .table("matches")
                .select("match_id,user_id,score,leaderboard_points,waves_cleared,enemies_defeated,compounds_discovered,highest_combo,turns_played,match_date,completed_at,profiles!inner(username,profile_picture_url,role)")
                .ilike("winner", "player")
                .eq("profiles.role", "student")
                .not_.is_("score", "null")
                .order("leaderboard_points", desc=True)
                .order("score", desc=True)
                .order("waves_cleared", desc=True)
                .order("compounds_discovered", desc=True)
                .order("turns_played")
                .order("match_date")
                .limit(limit)
                .execute()
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The ChemBattle leaderboard could not be loaded from Supabase.",
            ) from exc

        # Every completed winning run receives its own rank. This lets the
        # same student appear with distinct scores while keeping email and
        # other private match history details out of the public leaderboard.
        entries: List[dict] = []
        for row in response.data or []:
            profile = row.get("profiles") or {}
            if isinstance(profile, list):
                profile = profile[0] if profile else {}
            entries.append(
                {
                    "rank": len(entries) + 1,
                    "match_id": row["match_id"],
                    "username": profile.get("username") or "Qubo student",
                    "profile_picture_url": profile.get("profile_picture_url"),
                    "score": row["score"],
                    "leaderboard_points": row["leaderboard_points"],
                    "waves_cleared": row.get("waves_cleared") or 0,
                    "enemies_defeated": row.get("enemies_defeated") or 0,
                    "compounds_discovered": row.get("compounds_discovered") or 0,
                    "highest_combo": row.get("highest_combo") or 0,
                    "grade": cls._grade_for_score(row["score"]),
                    "turns_played": row["turns_played"],
                    "completed_at": row["completed_at"],
                    "played_at": row["completed_at"] or row["match_date"],
                }
            )
        return entries

    @staticmethod
    def _grade_for_score(score: int) -> str:
        if score >= 7000:
            return "S - Master Chemist"
        if score >= 5000:
            return "A - Senior Researcher"
        if score >= 3000:
            return "B - Lab Assistant"
        return "C - Chemistry Student"
