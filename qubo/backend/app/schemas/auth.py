from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date, datetime, time
from enum import Enum
import re


VALID_SPM_GRADES = {"A+", "A", "A-", "B+", "B", "C+", "C", "D", "E"}


class UserRole(str, Enum):
    STUDENT = "student"
    EDUCATOR = "educator"
    ADMIN = "admin"


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

    @field_validator("email")
    @classmethod
    def normalize_register_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

    @field_validator("username")
    @classmethod
    def normalize_username(cls, v: str) -> str:
        return v.strip()

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
    role: UserRole

    @field_validator("email")
    @classmethod
    def normalize_login_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()


class RefreshTokenRequest(BaseModel):
    """Request a new short-lived access token using a valid refresh token."""
    refresh_token: str = Field(..., min_length=1)


class ProfileUpdateRequest(BaseModel):
    """Profile update request"""
    username: Optional[str] = Field(None, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    profile_picture_url: Optional[str] = None
    learning_style: Optional[LearningStyle] = None
    form_level: Optional[str] = None  # Form 4 or Form 5
    school: Optional[str] = None
    target_grade: Optional[str] = None
    target_exam_date: Optional[date] = None

    @field_validator("full_name")
    @classmethod
    def validate_optional_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^[A-Za-z\s'-]+$", v):
            raise ValueError("Full name must contain only letters, spaces, hyphens, and apostrophes")
        return v

    @field_validator("target_exam_date")
    @classmethod
    def validate_target_exam_date(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v < date.today():
            raise ValueError("Target exam date cannot be in the past")
        return v

    @field_validator("target_grade")
    @classmethod
    def validate_target_grade(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None

        normalized_grade = v.strip().upper()
        if normalized_grade not in VALID_SPM_GRADES:
            raise ValueError("Target grade must be one of: A+, A, A-, B+, B, C+, C, D, E")
        return normalized_grade


class LearningStyleAssessmentRequest(BaseModel):
    """Learning style assessment request"""
    visual_score: int = Field(..., ge=0, le=100)
    auditory_score: int = Field(..., ge=0, le=100)
    kinesthetic_score: int = Field(..., ge=0, le=100)


class StudyReminderPreferences(BaseModel):
    """Saved study reminder controls for the signed-in student."""
    daily_flashcards_enabled: bool = True
    daily_flashcards_time: time = time(20, 0)
    nightly_review_enabled: bool = True
    nightly_review_time: time = time(22, 30)
    reminder_timezone: str = "Asia/Kuala_Lumpur"


class StudyReminderPreferencesUpdate(BaseModel):
    """Editable reminder fields. The app currently uses Malaysia time."""
    daily_flashcards_enabled: bool
    daily_flashcards_time: time
    nightly_review_enabled: bool
    nightly_review_time: time


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


class PasswordResetRequest(BaseModel):
    """Password reset email request"""
    email: EmailStr


class AccountActionRequest(BaseModel):
    """Password confirmation for destructive account actions."""
    password: str = Field(..., min_length=1)


class PasswordResetCompleteRequest(BaseModel):
    """New password plus the short-lived Supabase recovery access token."""
    recovery_access_token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_recovery_password_strength(cls, v: str) -> str:
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
    visual_score: Optional[int] = None
    auditory_score: Optional[int] = None
    kinesthetic_score: Optional[int] = None
    learning_style_assessed_at: Optional[datetime] = None
    form_level: Optional[str] = None
    school: Optional[str] = None
    target_grade: Optional[str] = None
    target_exam_date: Optional[date] = None
    created_at: datetime
    email_verified: Optional[bool] = None
    last_sign_in_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


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
    target_exam_date: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
