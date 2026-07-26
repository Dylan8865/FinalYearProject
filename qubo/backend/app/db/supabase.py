from supabase import ClientOptions, create_client
from app.core.config import settings

_supabase_admin = None


def _create_supabase_admin():
    """Create the privileged Supabase client, validating that credentials exist."""
    if not settings.SUPABASE_URL or settings.SUPABASE_URL.startswith("your_"):
        raise ValueError(
            "SUPABASE_URL is not configured. Copy backend/.env.example to "
            "backend/.env and fill in your real Supabase credentials."
        )
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY,
    )


def get_supabase():
    """Get the shared privileged client (lazy-initialised on first call)."""
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = _create_supabase_admin()
    return _supabase_admin


def create_supabase_auth_client():
    """Create an isolated client for one user authentication attempt.

    Unlike `get_supabase`, this returns a fresh client each time so that
    signing in a user does not contaminate the privileged admin client.
    """
    if not settings.SUPABASE_URL or settings.SUPABASE_URL.startswith("your_"):
        raise ValueError(
            "SUPABASE_URL is not configured. Copy backend/.env.example to "
            "backend/.env and fill in your real Supabase credentials."
        )
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
        ),
    )
