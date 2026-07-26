from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


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


class PredictionItem(BaseModel):
    id: str
    subject_id: str
    subject_name: str
    predicted_score: float
    risk_level: str
    threshold: float
    is_warning: bool
    basis_attempt_count: int
    generated_at: datetime


class SubjectAnalyticsItem(BaseModel):
    id: str
    subject_name: str
    category: Optional[str] = None
    overall_mastery: Optional[float] = None
    topics_total: int = 0
    topics_measured: int = 0
    study_minutes: int = 0
    study_sessions: int = 0
    quizzes_completed: int = 0
    learning_velocity: Optional[float] = None
    topic_performance: List[TopicPerformanceItem]
    recent_quiz_scores: List[QuizScorePoint]
    latest_prediction: Optional[PredictionItem] = None


class StudySessionCreate(BaseModel):
    subject_id: str
    topic_name: str = Field(..., min_length=2, max_length=120)
    duration_minutes: int = Field(..., ge=1, le=720)
    pomodoro_cycles: int = Field(default=0, ge=0, le=30)
    session_date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("topic_name")
    @classmethod
    def clean_topic_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Topic name must contain at least 2 characters")
        return cleaned


class StudySessionItem(BaseModel):
    id: str
    subject_id: str
    subject_name: str
    topic_id: str
    topic_name: str
    duration_minutes: int
    pomodoro_cycles: int
    session_date: datetime
    notes: Optional[str] = None


class ReviewScheduleItem(BaseModel):
    id: str
    subject_id: str
    subject_name: str
    topic_id: str
    topic_name: str
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: str
    last_reviewed_date: Optional[str] = None
    last_score: Optional[float] = None
    is_due: bool
    quiz_id: Optional[str] = None


class PredictionSettings(BaseModel):
    threshold: float = Field(..., ge=0, le=100)


class PredictionSettingsResponse(BaseModel):
    threshold: float


class StudentLinkRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        return value.strip()


class EducatorStudentSummary(BaseModel):
    id: str
    username: str
    full_name: str
    school: Optional[str] = None
    form_level: Optional[str] = None
    target_grade: Optional[str] = None
    profile_picture_url: Optional[str] = None
    subject_count: int = 0
    study_minutes: int = 0
    quizzes_completed: int = 0
    average_mastery: Optional[float] = None
    latest_prediction: Optional[float] = None
    at_risk: bool = False
    subjects: List[SubjectAnalyticsItem]


class EducatorClassSummary(BaseModel):
    linked_students: int
    students_at_risk: int
    average_prediction: Optional[float] = None
    total_study_minutes: int
    completed_quizzes: int


class EducatorDashboardResponse(BaseModel):
    summary: EducatorClassSummary
    students: List[EducatorStudentSummary]


class StudentLinkResponse(BaseModel):
    id: str
    message: str
