from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.config import SOURCE_CSV, SUPABASE_SCORES_TABLE, SUPABASE_TABLE

_DATE_COLS = ["created_at"]


def load_csv(path: Path | str = SOURCE_CSV) -> pd.DataFrame:
    """Load social_media_posts from CSV. Returns raw DataFrame."""
    df = pd.read_csv(path, parse_dates=_DATE_COLS, low_memory=False)
    return df


def load_supabase() -> pd.DataFrame:
    """Load social_media_posts from Supabase. Returns raw DataFrame."""
    from jobs.utils_db import get_client

    client = get_client()
    response = client.table(SUPABASE_TABLE).select("*").execute()
    df = pd.DataFrame(response.data)
    for col in _DATE_COLS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], utc=True, errors="coerce")
    return df


def write_scores_supabase(df: pd.DataFrame) -> None:
    """Upsert scored posts to post_analytics_scores, keyed on post_id."""
    from jobs.utils_db import get_client

    records = df.to_dict(orient="records")
    client = get_client()
    client.table(SUPABASE_SCORES_TABLE).upsert(
        records, on_conflict="post_id"
    ).execute()
    print(f"Upserted {len(records):,} rows to '{SUPABASE_SCORES_TABLE}'.")
