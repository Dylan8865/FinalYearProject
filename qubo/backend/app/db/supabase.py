from supabase import create_client
from app.core.config import settings

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def get_supabase():
    """Get Supabase client"""
    return supabase
