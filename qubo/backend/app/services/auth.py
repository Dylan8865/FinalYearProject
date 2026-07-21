from typing import Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.db.supabase import create_supabase_auth_client, get_supabase
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

    MAX_FAILED_LOGIN_ATTEMPTS = 5
    LOCKOUT_MINUTES = 15
    PROFILE_PICTURE_BUCKET = "avatars"

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
                .limit(1)
                .execute()
            )
            if existing_user.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to check existing email: {e}",
            )

        # Check if username already exists
        try:
            existing_username = (
                supabase.table("profiles")
                .select("id")
                .eq("username", user_data.username)
                .limit(1)
                .execute()
            )
            if existing_username.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken",
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to check existing username: {e}",
            )

        # Create confirmed Supabase Auth user for local development.
        # Passwords are still stored by Supabase Auth, not public.profiles.
        try:
            auth_response = supabase.auth.admin.create_user(
                {
                    "email": user_data.email,
                    "password": user_data.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "username": user_data.username,
                        "full_name": user_data.full_name,
                        "role": user_data.role.value,
                    },
                }
            )
            user_id = auth_response.user.id

            # Create profile (trigger has auto-created it, so we update the fields)
            profile_data = {
                "email": user_data.email,
                "username": user_data.username,
                "full_name": user_data.full_name,
                "role": user_data.role.value,
            }

            supabase.table("profiles").update(profile_data).eq("id", user_id).execute()

            # Generate tokens
            access_token = create_access_token(data={"sub": user_id})
            refresh_token = create_refresh_token(data={"sub": user_id})

            user_response = UserResponse(
                id=user_id,
                email=user_data.email,
                username=user_data.username,
                full_name=user_data.full_name,
                role=user_data.role,
                created_at=datetime.now(timezone.utc),
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

        # Fetch profile first so the API can give useful login feedback.
        try:
            profile_response = (
                supabase.table("profiles")
                .select("*")
                .eq("email", credentials.email)
                .limit(1)
                .execute()
            )
            profile = profile_response.data[0] if profile_response.data else None
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to check account: {e}",
            )

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please register first.",
            )

        account_role = profile.get("role")
        if account_role != credentials.role.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"This account is registered as an {account_role}. "
                    f"Select {account_role.capitalize()} before logging in."
                ),
            )

        if profile.get("locked_until"):
            locked_until_str = profile.get("locked_until")
            clean_str = locked_until_str.replace("Z", "+00:00")
            locked_until = datetime.fromisoformat(clean_str)
            if locked_until > datetime.now(timezone.utc):
                diff_mins = int((locked_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Account is temporarily locked. Try again in {diff_mins} minutes.",
                )

        try:
            # Authenticate with Supabase Auth
            auth_client = create_supabase_auth_client()
            auth_response = auth_client.auth.sign_in_with_password(
                {
                    "email": credentials.email,
                    "password": credentials.password,
                }
            )
            user_id = auth_response.user.id

            # Get user profile
            profile_response = (
                supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            )
            profile = profile_response.data

            # Reset failed login attempts on success
            if profile.get("failed_login_attempts", 0) > 0 or profile.get("locked_until"):
                supabase.table("profiles").update({
                    "failed_login_attempts": 0,
                    "locked_until": None
                }).eq("id", user_id).execute()

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
                form_level=profile.get("form_level"),
                school=profile.get("school"),
                target_grade=profile.get("target_grade"),
                target_exam_date=profile.get("target_exam_date"),
                created_at=profile.get("created_at"),
            )

            return AuthResponse(
                user=user_response,
                tokens=TokenResponse(
                    access_token=access_token,
                    refresh_token=refresh_token,
                ),
            )

        except Exception as e:
            error_message = str(e).lower()
            if "email not confirmed" in error_message or "confirm" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please confirm your email before logging in.",
                )
            if "email link" in error_message or "verification" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please verify your email before logging in.",
                )

            # Handle failed attempt
            attempts = profile.get("failed_login_attempts", 0) + 1
            remaining_attempts = max(AuthService.MAX_FAILED_LOGIN_ATTEMPTS - attempts, 0)
            lock_until = None
            if attempts >= AuthService.MAX_FAILED_LOGIN_ATTEMPTS:
                lock_until = (
                    datetime.now(timezone.utc) + timedelta(minutes=AuthService.LOCKOUT_MINUTES)
                ).isoformat()

            try:
                supabase.table("profiles").update({
                    "failed_login_attempts": attempts,
                    "locked_until": lock_until
                }).eq("id", profile["id"]).execute()
            except Exception:
                pass

            if lock_until:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Incorrect password. Account locked for {AuthService.LOCKOUT_MINUTES} minutes.",
                )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Incorrect password. {remaining_attempts} login attempts remaining.",
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
                    .limit(1)
                    .execute()
                )
                if existing.data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Username already taken",
                    )
            except HTTPException:
                raise
            except Exception:
                pass
            update_dict["username"] = update_data.username

        if update_data.full_name is not None:
            update_dict["full_name"] = update_data.full_name
        if update_data.profile_picture_url is not None:
            update_dict["profile_picture_url"] = update_data.profile_picture_url
        if update_data.learning_style is not None:
            update_dict["learning_style"] = update_data.learning_style.value
        if update_data.form_level is not None:
            update_dict["form_level"] = update_data.form_level
        if update_data.school is not None:
            update_dict["school"] = update_data.school
        if update_data.target_grade is not None:
            update_dict["target_grade"] = update_data.target_grade
        if update_data.target_exam_date is not None:
            update_dict["target_exam_date"] = update_data.target_exam_date.isoformat()

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
    def upload_profile_picture(
        user_id: str,
        file_content: bytes,
        content_type: str,
    ) -> UserResponse:
        """Upload and persist one user's profile picture."""
        supabase = get_supabase()
        object_path = f"{user_id}/avatar"

        try:
            bucket = supabase.storage.from_(AuthService.PROFILE_PICTURE_BUCKET)
            bucket.upload(
                object_path,
                file_content,
                {
                    "content-type": content_type,
                    "cache-control": "3600",
                    "upsert": "true",
                },
            )
            public_url = bucket.get_public_url(object_path).rstrip("?")
            versioned_url = f"{public_url}?v={int(datetime.now(timezone.utc).timestamp())}"
            supabase.table("profiles").update(
                {"profile_picture_url": versioned_url}
            ).eq("id", user_id).execute()
            return AuthService.get_profile(user_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to upload profile picture: {e}",
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

    @staticmethod
    def change_password(user_id: str, old_password: str, new_password: str) -> dict:
        """Change user password after verifying the old password"""
        supabase = get_supabase()
        try:
            # Get user email
            profile = (
                supabase.table("profiles")
                .select("email")
                .eq("id", user_id)
                .single()
                .execute()
                .data
            )
            if not profile:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found",
                )
            email = profile["email"]

            # Verify old password
            auth_client = create_supabase_auth_client()
            auth_client.auth.sign_in_with_password({
                "email": email,
                "password": old_password,
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect old password",
            )

        try:
            # Update password
            supabase.auth.admin.update_user_by_id(user_id, {"password": new_password})
            return {"message": "Password changed successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

    @staticmethod
    def send_password_reset(email: str) -> dict:
        """Send a Supabase password reset email if the account exists"""
        supabase = get_supabase()
        try:
            profile_response = (
                supabase.table("profiles")
                .select("id")
                .eq("email", email)
                .limit(1)
                .execute()
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to check account: {e}",
            )

        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please register first.",
            )

        try:
            supabase.auth.reset_password_email(email)
            return {"message": "Password reset email sent. Please check your inbox."}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to send reset email: {e}",
            )

    @staticmethod
    def recover_password(email: str, new_password: str) -> dict:
        """Reset a user's password directly for the local prototype"""
        supabase = get_supabase()
        try:
            profile_response = (
                supabase.table("profiles")
                .select("id")
                .eq("email", email)
                .limit(1)
                .execute()
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to check account: {e}",
            )

        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please register first.",
            )

        user_id = profile_response.data[0]["id"]
        try:
            supabase.auth.admin.update_user_by_id(
                user_id,
                {
                    "password": new_password,
                    "email_confirm": True,
                },
            )
            supabase.table("profiles").update({
                "failed_login_attempts": 0,
                "locked_until": None,
            }).eq("id", user_id).execute()
            return {"message": "Password updated successfully. You can log in with your new password."}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to reset password: {e}",
            )

    @staticmethod
    def get_subjects() -> list:
        """Get all subjects (auto-seeds core subjects if empty)"""
        supabase = get_supabase()
        try:
            res = supabase.table("subjects").select("*").execute()
            subjects = res.data
            if not subjects:
                # Auto-seed standard SPM subjects
                seed_subjects = [
                    {"subject_name": "Bahasa Melayu", "category": "Core"},
                    {"subject_name": "English", "category": "Core"},
                    {"subject_name": "Mathematics", "category": "Core"},
                    {"subject_name": "Science", "category": "Core"},
                    {"subject_name": "History", "category": "Core"},
                    {"subject_name": "Physics", "category": "Elective (Science)"},
                    {"subject_name": "Chemistry", "category": "Elective (Science)"},
                    {"subject_name": "Biology", "category": "Elective (Science)"},
                    {"subject_name": "Add Mathematics", "category": "Elective (Science)"},
                ]
                supabase.table("subjects").insert(seed_subjects).execute()
                res = supabase.table("subjects").select("*").execute()
                subjects = res.data
            return subjects
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

    @staticmethod
    def get_student_subjects(student_id: str) -> list:
        """Get list of subjects studied by the student"""
        supabase = get_supabase()
        try:
            res = (
                supabase.table("student_subjects")
                .select("subject_id, subjects(id, subject_name, category)")
                .eq("student_id", student_id)
                .execute()
            )
            subjects = []
            for item in res.data:
                if item.get("subjects"):
                    subjects.append(item["subjects"])
            return subjects
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

    @staticmethod
    def update_student_subjects(student_id: str, subject_ids: List[str]) -> list:
        """Update student's selected subjects list"""
        supabase = get_supabase()
        try:
            # Delete existing relations first
            supabase.table("student_subjects").delete().eq("student_id", student_id).execute()

            if subject_ids:
                # Bulk insert new relations
                insert_data = [
                    {"student_id": student_id, "subject_id": sid}
                    for sid in subject_ids
                ]
                supabase.table("student_subjects").insert(insert_data).execute()

            return AuthService.get_student_subjects(student_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
