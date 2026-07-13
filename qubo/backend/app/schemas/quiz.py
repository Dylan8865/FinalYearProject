from typing import List, Literal

from pydantic import BaseModel, Field, field_validator


QuestionType = Literal["mcq", "fill", "short"]
DifficultyLevel = Literal["Beginner", "Intermediate", "Advanced"]


class GeneratedQuestion(BaseModel):
    question: str = Field(..., min_length=5)
    question_type: QuestionType
    options: List[str] = Field(default_factory=list)
    correct_answer: str = Field(..., min_length=1)
    explanation: str = Field(..., min_length=1)

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
    question_type: QuestionType
    difficulty: DifficultyLevel
    source_files: List[str]
    questions: List[GeneratedQuestion]

