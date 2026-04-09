"""Feature engineering — shared by training and inference pipelines."""
import pandas as pd
import numpy as np
from datetime import datetime, timezone


def build_donation_features(supporters: pd.DataFrame, donations: pd.DataFrame, reference_date=None) -> pd.DataFrame:
    """
    Join supporters with aggregated donation features.
    reference_date: the 'as-of' date for computing recency.
                    Defaults to today (use a past date for historical label construction).
    """
    if reference_date is None:
        reference_date = pd.Timestamp.now(tz="UTC")
    else:
        reference_date = pd.Timestamp(reference_date, tz="UTC")

    donations = donations.copy()
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], utc=True)

    # Only use donations up to reference_date (prevents future leakage)
    past_donations = donations[donations["donation_date"] <= reference_date]

    # Aggregate per supporter
    agg = past_donations.groupby("supporter_id").agg(
        total_donations=("donation_id", "count"),
        last_donation_date=("donation_date", "max"),
        first_donation_date_d=("donation_date", "min"),
        total_estimated_value=("estimated_value", "sum"),
        mean_estimated_value=("estimated_value", "mean"),
        has_recurring=("is_recurring", "any"),
        n_campaigns=("campaign_name", "nunique"),
        n_channels=("channel_source", "nunique"),
        monetary_donations=("donation_type", lambda x: (x == "Monetary").sum()),
        time_donations=("donation_type", lambda x: (x == "Time").sum()),
        inkind_donations=("donation_type", lambda x: (x == "InKind").sum()),
    ).reset_index()

    agg["days_since_last_donation"] = (reference_date - agg["last_donation_date"]).dt.days
    agg["donor_tenure_days"] = (reference_date - agg["first_donation_date_d"]).dt.days
    agg["avg_days_between_donations"] = agg["donor_tenure_days"] / agg["total_donations"].clip(lower=1)
    agg["has_recurring"] = agg["has_recurring"].astype(int)

    # Join to supporters
    supporters = supporters.copy()
    supporters["supporter_tenure_days"] = (reference_date - pd.to_datetime(supporters["created_at"], utc=True)).dt.days

    df = supporters.merge(agg, on="supporter_id", how="left")

    # Donors with no donations at all
    df["total_donations"] = df["total_donations"].fillna(0).astype(int)
    df["days_since_last_donation"] = df["days_since_last_donation"].fillna(9999)

    return df


def add_label(df: pd.DataFrame, **kwargs) -> pd.DataFrame:
    """Add binary at_risk label: 1 if supporter status is Inactive, else 0."""
    df = df.copy()
    df["at_risk"] = (df["status"] == "Inactive").astype(int)
    return df
