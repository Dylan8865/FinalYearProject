from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TopicPerformanceItem(BaseModel):
    topic_id: str
    topic_name: str
    difficulty_level: Optional[str] = None
    score_percentage: Optional[float] = None
    sessions_count: int = 0
    last_updated: Optional[datetime] = None


class QuizScorePoint(BaseModel):
    score: float
    attempted_at: datetime


class SubjectAnalyticsItem(BaseModel):
    id: str
    subject_name: str
    category: Optional[str] = None
    overall_mastery: Optional[float] = None
    topics_total: int = 0
    topics_measured: int = 0
    study_minutes: int = 0
    quizzes_completed: int = 0
    topic_performance: List[TopicPerformanceItem]
    recent_quiz_scores: List[QuizScorePoint]
