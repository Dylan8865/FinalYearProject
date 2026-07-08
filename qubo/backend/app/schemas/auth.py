from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


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


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    """Profile update request"""
    username: Optional[str] = Field(None, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    learning_style: Optional[LearningStyle] = None
    form_level: Optional[str] = None  # Form 4 or Form 5
    school: Optional[str] = None
    target_grade: Optional[str] = None
    target_exam_date: Optional[datetime] = None


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
