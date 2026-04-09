"""
Outreach profiles job — rule-based per-donor outreach recommendations.

For each active donor, derives:
  - preferred_channel: most common ChannelSource in their donation history
  - cadence: giving frequency pattern (Monthly, Quarterly, Annual, Sporadic)
  - message_template: one of four content types
  - best_day: Monday or Tuesday (peak engagement days from social data)
  - ask_type: upgrade, renew_recurring, reactivate, or thank_you

Output is written to Supabase table: donor_outreach_profiles

Run: python -m jobs.score_outreach_profiles
"""
import json
import os
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.data_io import load_supabase


# ── Message template selection logic ─────────────────────────────────────────

def pick_message_template(
    has_recurring: bool,
    n_campaigns: int,
    days_since_last: float,
    referral_via_social: bool,
) -> str:
    """
    Choose the best message template based on donor engagement patterns.

    Templates:
    - impact_story: for recurring donors or those who've given to 2+ campaigns
    - resident_update: for long-tenured donors wanting to see progress
    - campaign_appeal: for donors who responded to past campaigns
    - thank_you_stewardship: for recently active donors who need nurturing
    """
    if referral_via_social:
        return "impact_story"      # they came through social — show impact
    if has_recurring:
        return "resident_update"   # committed donors want to see outcomes
    if n_campaigns >= 2:
        return "campaign_appeal"   # multi-campaign donors respond to new appeals
    if days_since_last <= 60:
        return "thank_you_stewardship"  # recently active — steward the relationship
    return "impact_story"          # default: show how donations are making a difference


def pick_cadence(avg_days_between: float) -> str:
    if avg_days_between <= 35:
        return "Monthly"
    if avg_days_between <= 100:
        return "Quarterly"
    if avg_days_between <= 400:
        return "Annual"
    return "Sporadic"


def pick_ask_type(
    has_recurring: bool,
    days_since_last: float,
    avg_gift: float,
    segment_avg_gift: float,
) -> str:
    if days_since_last > 180:
        return "reactivate"
    if has_recurring and avg_gift < segment_avg_gift:
        return "recurring_upgrade"
    if not has_recurring and days_since_last <= 90:
        return "setup_recurring"
    if avg_gift < segment_avg_gift * 0.7:
        return "upgrade"
    return "thank_you"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Loading data from Supabase...")
    supporters, donations = load_supabase()

    now = pd.Timestamp.now(tz="UTC")
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], utc=True)

    # ── Aggregate per supporter ────────────────────────────────────────────────
    agg = donations.groupby("supporter_id").agg(
        preferred_channel=("channel_source", lambda x: x.mode()[0] if len(x) > 0 else "Unknown"),
        n_campaigns=("campaign_name", "nunique"),
        has_recurring=("is_recurring", "any"),
        avg_gift=("estimated_value", "mean"),
        last_donation_date=("donation_date", "max"),
        first_donation_date=("donation_date", "min"),
        total_donations=("donation_id", "count"),
        has_referral_post=("referral_post_id", lambda x: x.notna().any()),
    ).reset_index()

    agg["days_since_last"] = (now - agg["last_donation_date"]).dt.days
    agg["donor_tenure_days"] = (now - agg["first_donation_date"]).dt.days
    agg["avg_days_between"] = agg["donor_tenure_days"] / agg["total_donations"].clip(lower=1)
    agg["has_recurring"] = agg["has_recurring"].astype(bool)

    # Segment average gift for upgrade comparison
    segment_avg_gift = agg["avg_gift"].median()

    # ── Active donors only ─────────────────────────────────────────────────────
    active_ids = set(supporters[supporters["status"] == "Active"]["supporter_id"].tolist())
    agg = agg[agg["supporter_id"].isin(active_ids)].copy()

    print(f"Building outreach profiles for {len(agg)} active donors...")

    profiles = []
    scored_at = datetime.now(timezone.utc).isoformat()

    for _, row in agg.iterrows():
        template = pick_message_template(
            has_recurring=bool(row["has_recurring"]),
            n_campaigns=int(row["n_campaigns"]),
            days_since_last=float(row["days_since_last"]),
            referral_via_social=bool(row["has_referral_post"]),
        )
        cadence = pick_cadence(float(row["avg_days_between"]))
        ask_type = pick_ask_type(
            has_recurring=bool(row["has_recurring"]),
            days_since_last=float(row["days_since_last"]),
            avg_gift=float(row["avg_gift"]) if pd.notna(row["avg_gift"]) else 0.0,
            segment_avg_gift=float(segment_avg_gift),
        )

        profiles.append({
            "supporter_id":     int(row["supporter_id"]),
            "preferred_channel": str(row["preferred_channel"]),
            "cadence":          cadence,
            "message_template": template,
            "best_day":         "Monday",   # from social media analytics: Mon/Tue peak
            "ask_type":         ask_type,
            "scored_at":        scored_at,
        })

    df_profiles = pd.DataFrame(profiles)

    print("Writing outreach profiles to Supabase...")
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    client = create_client(url, key)
    records = df_profiles.to_dict(orient="records")
    client.table("donor_outreach_profiles").upsert(records).execute()
    print(f"Done. Wrote {len(records)} outreach profiles.")


if __name__ == "__main__":
    main()
