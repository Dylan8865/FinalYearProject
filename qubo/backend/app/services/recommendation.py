import os

import requests

from app.core.config import settings


class RecommendationExplanationService:
    """Optional LLM copywriter. It never chooses an item or sees student PII."""

    @staticmethod
    def explain(title: str, subject: str | None, rule_reason: str) -> str:
        if not settings.GEMINI_API_KEY or not settings.ENABLE_LLM_RECOMMENDATION_EXPLANATIONS:
            return rule_reason
        prompt = (
            "Write one warm, factual sentence (maximum 35 words) explaining a learning recommendation. "
            "Do not invent achievements, facts, content features, or personal details. "
            f"Selected item: {title}. Subject: {subject or 'not supplied'}. "
            f"Rule-based reason: {rule_reason}"
        )
        model = os.getenv("GEMINI_RECOMMENDATION_MODEL", "gemini-2.5-flash")
        try:
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                headers={"x-goog-api-key": settings.GEMINI_API_KEY, "Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.2, "maxOutputTokens": 80}},
                timeout=8,
            )
            text = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            return text[:280] if response.ok and text else rule_reason
        except (requests.RequestException, KeyError, IndexError, TypeError, ValueError):
            return rule_reason
