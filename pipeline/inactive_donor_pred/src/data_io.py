"""Data loading utilities — CSV (dev) and Supabase (prod)."""
import json
import os
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / '.env', override=True)


def load_csv(supporters_path, donations_path) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load raw supporters and donations from CSV files."""
    supporters = pd.read_csv(supporters_path, parse_dates=["created_at", "first_donation_date"])
    donations = pd.read_csv(donations_path, parse_dates=["donation_date"])
    return supporters, donations


def load_supabase() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load supporters and donations from Supabase."""
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    client = create_client(url, key)

    supporters = pd.DataFrame(client.table("supporters").select("*").execute().data)
    donations = pd.DataFrame(client.table("donations").select("*").execute().data)

    supporters["created_at"] = pd.to_datetime(supporters["created_at"], format="ISO8601")
    supporters["first_donation_date"] = pd.to_datetime(supporters["first_donation_date"], format="ISO8601")
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], format="ISO8601")

    return supporters, donations


def _clean_record(row: dict) -> dict:
    """Convert numpy scalars and NaN to plain Python types for JSON serialization."""
    import math
    import numpy as np
    out = {}
    for k, v in row.items():
        if isinstance(v, float) and math.isnan(v):
            out[k] = None
        elif isinstance(v, (np.integer,)):
            out[k] = int(v)
        elif isinstance(v, (np.floating,)):
            out[k] = float(v)
        elif isinstance(v, (np.bool_,)):
            out[k] = bool(v)
        else:
            out[k] = v
    return out


def write_predictions_supabase(df: pd.DataFrame):
    """Upsert risk score predictions into Supabase donor_risk_scores table."""
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    client = create_client(url, key)
    records = [_clean_record(row) for row in df.to_dict(orient="records")]
    client.table("donor_risk_scores").upsert(records).execute()
