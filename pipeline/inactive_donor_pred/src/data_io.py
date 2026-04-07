"""Data loading utilities — CSV (dev) and Supabase (prod)."""
import os
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


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

    supporters["created_at"] = pd.to_datetime(supporters["created_at"])
    supporters["first_donation_date"] = pd.to_datetime(supporters["first_donation_date"])
    donations["donation_date"] = pd.to_datetime(donations["donation_date"])

    return supporters, donations


def write_predictions_supabase(df: pd.DataFrame):
    """Upsert risk score predictions into Supabase donor_risk_scores table."""
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    client = create_client(url, key)
    records = df.to_dict(orient="records")
    client.table("donor_risk_scores").upsert(records).execute()
