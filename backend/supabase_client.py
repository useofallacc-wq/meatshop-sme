"""
Creates a single shared Supabase client used across the whole API.
Reads credentials from environment variables (loaded via .env by app.py).
"""

import os
from supabase import create_client, Client

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Returns a cached Supabase client instance, creating it on first use."""
    global _supabase_client

    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")

        if not url or not key:
            raise RuntimeError(
                "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. "
                "Copy backend/.env.example to backend/.env and fill in your project's values."
            )

        _supabase_client = create_client(url, key)

    return _supabase_client
