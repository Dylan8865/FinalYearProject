from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re


class UserRole(str, Enum):
    STUDENT = "student"
    EDUCATOR = "educator"


class LearningStyle(str, Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"


# Request Schemas
class UserRegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., max_length=100)
    role: UserRole = UserRole.STUDENT

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if v and not re.match(r"^[A-Za-z\s'-]+$", v):
            raise ValueError("Full name must contain only letters, spaces, hyphens, and apostrophes")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "@$!%*?&#" for c in v):
            raise ValueError("Password must contain at least one special character (@$!%*?&#)")
        return v


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    """Profile update request"""
    username: Optional[str] = Field(None, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    profile_picture_url: Optional[str] = None
    learning_style: Optional[LearningStyle] = None
    form_level: Optional[str] = None  # Form 4 or Form 5
    school: Optional[str] = None
    target_grade: Optional[str] = None
    target_exam_date: Optional[datetime] = None

    @field_validator("full_name")
    @classmethod
    def validate_optional_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^[A-Za-z\s'-]+$", v):
            raise ValueError("Full name must contain only letters, spaces, hyphens, and apostrophes")
        return v


class LearningStyleAssessmentRequest(BaseModel):
    """Learning style assessment request"""
    visual_score: int = Field(..., ge=0, le=100)
    auditory_score: int = Field(..., ge=0, le=100)
    kinesthetic_score: int = Field(..., ge=0, le=100)


class PasswordChangeRequest(BaseModel):
    """Password change request"""
    old_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "@$!%*?&#" for c in v):
            raise ValueError("Password must contain at least one special character (@$!%*?&#)")
        return v


class SubjectResponse(BaseModel):
    """Subject response"""
    id: str
    subject_name: str
    category: Optional[str] = None


class StudentSubjectsUpdateRequest(BaseModel):
    """Student subjects update request"""
    subject_ids: List[str]


# Response Schemas
class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response"""
    id: str
    email: str
    username: str
    full_name: str
    role: UserRole
    profile_picture_url: Optional[str] = None
    learning_style: Optional[LearningStyle] = None
    form_level: Optional[str] = None
    school: Optional[str] = None
    target_grade: Optional[str] = None
    target_exam_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response with user and tokens"""
    user: UserResponse
    tokens: TokenResponse


class ProfileResponse(BaseModel):
    """Profile response"""
    id: str
    username: str
    full_name: str
    email: str
    role: UserRole
    profile_picture_url: Optional[str] = None
    learning_style: Optional[LearningStyle] = None
    form_level: Optional[str] = None
    school: Optional[str] = None
    target_grade: Optional[str] = None
    target_exam_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
