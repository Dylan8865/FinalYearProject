import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Any, Optional


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Qubo API"
    PROJECT_DESCRIPTION: str = "AI-Powered Personalized Learning Platform"
    VERSION: str = "0.1.0"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"true", "1", "yes", "on"}:
                return True
            if normalized in {"false", "0", "no", "off", "release", "production"}:
                return False
        return bool(value)
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://qubo_user:qubo_password@localhost:5432/qubo"
    )
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    PASSWORD_RESET_REDIRECT_URL: str = os.getenv(
        "PASSWORD_RESET_REDIRECT_URL",
        "http://localhost:3000/reset-password",
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ENABLE_LLM_RECOMMENDATION_EXPLANATIONS: bool = os.getenv("ENABLE_LLM_RECOMMENDATION_EXPLANATIONS", "false").lower() in {"1", "true", "yes", "on"}
    GOOGLE_OAUTH_CLIENT_ID: str = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
    GOOGLE_OAUTH_CLIENT_SECRET: str = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173",
    ]
    
    # Email (optional)
    SMTP_SERVER: Optional[str] = os.getenv("SMTP_SERVER")
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
