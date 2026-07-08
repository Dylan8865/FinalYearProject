from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    ProfileUpdateRequest,
    LearningStyleAssessmentRequest,
    AuthResponse,
    UserResponse,
)
from app.services.auth import AuthService
from app.db.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegisterRequest):
    """Register a new user"""
    return AuthService.register(user_data)


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLoginRequest):
    """Login user"""
    return AuthService.login(credentials)


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: ProfileUpdateRequest,
    current_user = Depends(get_current_user),
):
    """Update user profile"""
    user_id = current_user.get("id")
    return AuthService.update_profile(user_id, update_data)


@router.post("/learning-style")
async def set_learning_style(
    assessment: LearningStyleAssessmentRequest,
    current_user = Depends(get_current_user),
):
    """Set user learning style based on assessment"""
    user_id = current_user.get("id")
    return AuthService.set_learning_style(
        user_id,
        assessment.visual_score,
        assessment.auditory_score,
        assessment.kinesthetic_score,
    )


@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """Logout user (client-side token deletion)"""
    return {"message": "Logged out successfully"}
