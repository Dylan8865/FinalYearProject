"""
AI Moderation Service — Heuristic Keyword-Based Engine.

Phase 1: Deterministic fast-filtering keyword engine.
Phase 2 (future): Integrate external LLM API for semantic understanding.
"""

import re
from typing import Optional


# ---------------------------------------------------------------------------
# Trigger word library — Educational platform context
# Words / phrases that clearly violate a student learning platform's policy.
# ---------------------------------------------------------------------------
_BANNED_TERMS: list[str] = [
    # Gambling
    "casino", "gambling", "poker", "blackjack", "slot machine", "sports betting",
    # Profanity (common)
    "fuck", "shit", "bitch", "asshole", "bastard", "damn",
    # Violence / threats
    "kill yourself", "kys", "suicide method", "how to die",
    # Adult / explicit
    "porn", "pornography", "nude", "xxx", "onlyfans", "sex video",
    # Scam / fraud
    "scam", "ponzi", "pyramid scheme", "get rich quick", "make money fast",
    "click here to win", "you have been selected",
    # Off-topic platforms (context-breaking)
    "subscribe to my youtube", "follow my tiktok", "join my discord server",
    # Advertising
    "buy now", "limited offer", "promo code", "discount link",
]

# Pre-compile all patterns for speed
_PATTERNS = [re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE) for term in _BANNED_TERMS]


class AIModerationService:
    """
    Scans text content (titles, descriptions, annotation text) against
    a curated blocklist.

    Usage:
        result = AIModerationService.scan("hello world")
        if not result["is_safe"]:
            print(result["flag_reason"])
    """

    @staticmethod
    def scan(text: Optional[str]) -> dict:
        """
        Returns dict with:
          - is_safe (bool): True if the text is clean.
          - flag_reason (str | None): Human-readable reason if flagged, else None.
          - matched_term (str | None): The first matching trigger word.
        """
        if not text or not text.strip():
            return {"is_safe": True, "flag_reason": None, "matched_term": None}

        for pattern, term in zip(_PATTERNS, _BANNED_TERMS):
            if pattern.search(text):
                return {
                    "is_safe": False,
                    "flag_reason": f"System Auto-Lock: Content flagged for containing inappropriate term.",
                    "matched_term": term,
                }

        return {"is_safe": True, "flag_reason": None, "matched_term": None}

    @classmethod
    def scan_multiple(cls, *texts: Optional[str]) -> dict:
        """Scan multiple text fields (e.g., title + description + annotation)."""
        for text in texts:
            result = cls.scan(text)
            if not result["is_safe"]:
                return result
        return {"is_safe": True, "flag_reason": None, "matched_term": None}
