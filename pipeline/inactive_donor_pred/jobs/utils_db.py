"""Supabase client helper."""
import os
from dotenv import load_dotenv

load_dotenv()


def get_client():
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    return create_client(url, key)
