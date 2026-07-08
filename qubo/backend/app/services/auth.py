from typing import Optional
from datetime import timedelta
from fastapi import HTTPException, status
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.db.supabase import get_supabase
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    ProfileUpdateRequest,
    UserResponse,
    TokenResponse,
    AuthResponse,
)


class AuthService:
    """Authentication business logic"""

    @staticmethod
    def register(user_data: UserRegisterRequest) -> AuthResponse:
        """Register a new user"""
        supabase = get_supabase()

        # Check if email already exists
        try:
            existing_user = (
                supabase.table("profiles")
                .select("id")
                .eq("email", user_data.email)
                .single()
                .execute()
            )
            if existing_user.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
        except Exception as e:
            # Email doesn't exist (expected)
            if "No rows found" not in str(e):
                raise

        # Check if username already exists
        try:
            existing_username = (
                supabase.table("profiles")
                .select("id")
                .eq("username", user_data.username)
                .single()
                .execute()
            )
            if existing_username.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken",
                )
        except Exception as e:
            if "No rows found" not in str(e):
                raise

        # Sign up with Supabase Auth
        try:
            auth_response = supabase.auth.sign_up(
                email=user_data.email,
                password=user_data.password,
            )
            user_id = auth_response.user.id

            # Create profile
            profile_data = {
                "id": user_id,
                "email": user_data.email,
                "username": user_data.username,
                "full_name": user_data.full_name,
                "role": user_data.role.value,
            }

            supabase.table("profiles").insert(profile_data).execute()

            # Generate tokens
            access_token = create_access_token(data={"sub": user_id})
            refresh_token = create_refresh_token(data={"sub": user_id})

            user_response = UserResponse(
                id=user_id,
                email=user_data.email,
                username=user_data.username,
                full_name=user_data.full_name,
                role=user_data.role,
            )

            return AuthResponse(
                user=user_response,
                tokens=TokenResponse(
                    access_token=access_token,
                    refresh_token=refresh_token,
                ),
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

    @staticmethod
    def login(credentials: UserLoginRequest) -> AuthResponse:
        """Login user"""
        supabase = get_supabase()

        try:
            # Authenticate with Supabase Auth
            auth_response = supabase.auth.sign_in_with_password(
                email=credentials.email,
                password=credentials.password,
            )
            user_id = auth_response.user.id

            # Get user profile
            profile_response = (
                supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            )
            profile = profile_response.data

            # Generate tokens
            access_token = create_access_token(data={"sub": user_id})
            refresh_token = create_refresh_token(data={"sub": user_id})

            user_response = UserResponse(
                id=profile["id"],
                email=profile["email"],
                username=profile["username"],
                full_name=profile["full_name"],
                role=profile["role"],
                profile_picture_url=profile.get("profile_picture_url"),
                learning_style=profile.get("learning_style"),
            )

            return AuthResponse(
                user=user_response,
                tokens=TokenResponse(
                    access_token=access_token,
                    refresh_token=refresh_token,
                ),
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

    @staticmethod
    def get_profile(user_id: str) -> UserResponse:
        """Get user profile"""
        supabase = get_supabase()

        try:
            profile_response = (
                supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            )
            profile = profile_response.data

            return UserResponse(
                id=profile["id"],
                email=profile["email"],
                username=profile["username"],
                full_name=profile["full_name"],
                role=profile["role"],
                profile_picture_url=profile.get("profile_picture_url"),
                learning_style=profile.get("learning_style"),
                form_level=profile.get("form_level"),
                school=profile.get("school"),
                target_grade=profile.get("target_grade"),
                target_exam_date=profile.get("target_exam_date"),
                created_at=profile.get("created_at"),
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    @staticmethod
    def update_profile(user_id: str, update_data: ProfileUpdateRequest) -> UserResponse:
        """Update user profile"""
        supabase = get_supabase()

        # Prepare update data (only non-None fields)
        update_dict = {}
        if update_data.username:
            # Check if username is unique
            try:
                existing = (
                    supabase.table("profiles")
                    .select("id")
                    .eq("username", update_data.username)
                    .neq("id", user_id)
                    .single()
                    .execute()
                )
                if existing.data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Username already taken",
                    )
            except:
                pass
            update_dict["username"] = update_data.username

        if update_data.full_name:
            update_dict["full_name"] = update_data.full_name
        if update_data.learning_style:
            update_dict["learning_style"] = update_data.learning_style.value
        if update_data.form_level:
            update_dict["form_level"] = update_data.form_level
        if update_data.school:
            update_dict["school"] = update_data.school
        if update_data.target_grade:
            update_dict["target_grade"] = update_data.target_grade
        if update_data.target_exam_date:
            update_dict["target_exam_date"] = update_data.target_exam_date

        if not update_dict:
            return AuthService.get_profile(user_id)

        try:
            supabase.table("profiles").update(update_dict).eq("id", user_id).execute()
            return AuthService.get_profile(user_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

    @staticmethod
    def set_learning_style(user_id: str, visual: int, auditory: int, kinesthetic: int) -> dict:
        """Set user learning style based on assessment scores"""
        # Determine dominant learning style
        scores = {
            "visual": visual,
            "auditory": auditory,
            "kinesthetic": kinesthetic,
        }
        dominant_style = max(scores, key=scores.get)

        supabase = get_supabase()
        try:
            supabase.table("profiles").update(
                {"learning_style": dominant_style}
            ).eq("id", user_id).execute()

            return {
                "learning_style": dominant_style,
                "scores": scores,
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
