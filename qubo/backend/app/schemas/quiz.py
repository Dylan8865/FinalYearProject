from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


QuestionType = Literal["mcq", "fill", "short"]
DifficultyLevel = Literal["Beginner", "Intermediate", "Advanced"]


class GeneratedQuestion(BaseModel):
    id: Optional[str] = None
    question: str = Field(..., min_length=5)
    question_type: QuestionType
    options: List[str] = Field(default_factory=list)
    correct_answer: str = Field(..., min_length=1)
    explanation: str = ""

    @field_validator("options")
    @classmethod
    def validate_mcq_options(cls, value: List[str], info):
        question_type = info.data.get("question_type")
        if question_type == "mcq" and len(value) != 4:
            raise ValueError("MCQ questions must contain exactly four options")
        return value


class GeneratedQuizResponse(BaseModel):
    title: str
    subject: str
    topic: str = Field(..., min_length=2, max_length=120)
    question_type: QuestionType
    difficulty: DifficultyLevel
    source_files: List[str]
    questions: List[GeneratedQuestion]


class SaveQuizRequest(GeneratedQuizResponse):
    pass


class SavedQuizResponse(BaseModel):
    id: str
    message: str


class QuizAnswerRequest(BaseModel):
    question_index: int = Field(..., ge=0, le=19)
    selected_answer: Optional[str] = Field(default=None, max_length=2000)
    time_spent_seconds: int = Field(default=0, ge=0, le=7200)


class QuizAttemptRequest(BaseModel):
    score: float = Field(..., ge=0, le=100)
    total_questions: int = Field(..., ge=1, le=20)
    time_taken_seconds: int = Field(..., ge=0)
    answers: List[QuizAnswerRequest] = Field(default_factory=list, max_length=20)


class QuizAttemptResponse(BaseModel):
    id: str
    message: str
    prediction: Optional[dict] = None
    review_schedule: Optional[dict] = None


class LibraryQuizItem(BaseModel):
    id: str
    title: str
    subject: Optional[str] = None
    source_type: str
    created_at: datetime
    has_in_progress_attempt: bool = False


class QuizProgressRequest(BaseModel):
    current_index: int = Field(default=0, ge=0, le=100)
    elapsed_seconds: int = Field(default=0, ge=0)
    answers: Dict[str, str] = Field(default_factory=dict)
    answer_times: Dict[str, int] = Field(default_factory=dict)


class QuizProgressResponse(QuizProgressRequest):
    pass


class AssignQuizRequest(BaseModel):
    student_id: str = Field(..., min_length=1)
