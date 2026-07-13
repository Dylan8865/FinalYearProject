from supabase import ClientOptions, create_client
from app.core.config import settings

# Keep the privileged client separate from user authentication. Signing in on a
# Supabase client changes that client's Authorization header to the user's JWT,
# which would make later auth.admin calls fail with "User not allowed".
supabase_admin = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY,
)


def get_supabase():
    """Get the shared privileged client used for server-side operations."""
    return supabase_admin


def create_supabase_auth_client():
    """Create an isolated client for one user authentication attempt."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
        ),
    )
