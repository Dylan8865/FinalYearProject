import asyncio

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool
from typing import List
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    RefreshTokenRequest,
    ProfileUpdateRequest,
    LearningStyleAssessmentRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordRecoveryRequest,
    SubjectResponse,
    StudentSubjectsUpdateRequest,
    AuthResponse,
    TokenResponse,
    UserResponse,
)
from app.services.auth import AuthService
from app.db.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
REGISTRATION_TIMEOUT_SECONDS = 15
MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024
ALLOWED_PROFILE_PICTURE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegisterRequest):
    """Register a new user"""
    try:
        return await asyncio.wait_for(
            run_in_threadpool(AuthService.register, user_data),
            timeout=REGISTRATION_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Registration timed out. Please try again.",
        ) from exc


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLoginRequest):
    """Login user"""
    return AuthService.login(credentials)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(refresh_data: RefreshTokenRequest):
    """Renew an expired short-lived access token without interrupting the user."""
    return AuthService.refresh_access_token(refresh_data.refresh_token)


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


@router.post("/profile/picture", response_model=UserResponse)
async def upload_profile_picture(
    picture: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    """Upload a validated profile picture to Supabase Storage."""
    if picture.content_type not in ALLOWED_PROFILE_PICTURE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Profile picture must be a JPEG, PNG, WebP, or GIF image.",
        )

    content = await picture.read(MAX_PROFILE_PICTURE_SIZE + 1)
    if len(content) > MAX_PROFILE_PICTURE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile picture must be 5 MB or smaller.",
        )
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected image is empty.",
        )

    user_id = current_user.get("id")
    return await run_in_threadpool(
        AuthService.upload_profile_picture,
        user_id,
        content,
        picture.content_type,
    )


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


@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user = Depends(get_current_user),
):
    """Change user password"""
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    user_id = current_user.get("id")
    return AuthService.change_password(
        user_id,
        password_data.old_password,
        password_data.new_password
    )


@router.post("/forgot-password")
async def forgot_password(reset_data: PasswordResetRequest):
    """Send password reset email"""
    return AuthService.send_password_reset(reset_data.email)


@router.post("/recover-password")
async def recover_password(recovery_data: PasswordRecoveryRequest):
    """Reset password directly for the local prototype"""
    if recovery_data.new_password != recovery_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    return AuthService.recover_password(
        recovery_data.email,
        recovery_data.new_password,
    )


@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects():
    """Get all available subjects"""
    return AuthService.get_subjects()


@router.get("/profile/subjects", response_model=List[SubjectResponse])
async def get_student_subjects(current_user = Depends(get_current_user)):
    """Get selected subjects for the student"""
    user_id = current_user.get("id")
    return AuthService.get_student_subjects(user_id)


@router.post("/profile/subjects", response_model=List[SubjectResponse])
async def update_student_subjects(
    subjects_data: StudentSubjectsUpdateRequest,
    current_user = Depends(get_current_user),
):
    """Update student's selected subjects"""
    user_id = current_user.get("id")
    return AuthService.update_student_subjects(user_id, subjects_data.subject_ids)


@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """Logout user (client-side token deletion)"""
    return {"message": "Logged out successfully"}
