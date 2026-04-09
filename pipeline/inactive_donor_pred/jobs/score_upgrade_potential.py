"""
Upgrade potential scoring job — RFM segmentation to identify donors who could give more.

Segments each active donor into one of four RFM quadrants:
  - High Potential: frequent + recent + below-average gift → prime upgrade candidates
  - Champion:       frequent + recent + above-average gift → steward and thank
  - At Risk:        frequent + lapsed                      → re-engage
  - Lapsed:         infrequent or very old                 → win-back / low priority

For each donor, computes:
  - rfm_segment: the segment name
  - upgrade_candidate: True if High Potential
  - upgrade_score: 0–1 composite score (higher = better upgrade candidate)
  - current_avg_gift: their average monetary gift
  - segment_avg_gift: median avg gift across all active donors

Output is written to Supabase table: donor_upgrade_scores

Run: python -m jobs.score_upgrade_potential
"""
import os
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.data_io import load_supabase


def rfm_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute R, F, M percentile scores (1–4, 4 = best) for each donor.
    R: days_since_last (lower is better → invert rank)
    F: total_donations (higher is better)
    M: avg_gift (higher is better)
    """
    df = df.copy()

    # Recency: rank ascending (fewer days = higher score)
    df["r_score"] = pd.qcut(df["days_since_last"].rank(method="first", ascending=True),
                             q=4, labels=[4, 3, 2, 1]).astype(int)

    # Frequency: rank descending (more donations = higher score)
    df["f_score"] = pd.qcut(df["total_donations"].rank(method="first", ascending=False),
                             q=4, labels=[4, 3, 2, 1]).astype(int)

    # Monetary: rank descending (higher avg gift = higher score)
    df["m_score"] = pd.qcut(df["avg_gift"].rank(method="first", ascending=False),
                             q=4, labels=[4, 3, 2, 1]).astype(int)

    return df


def assign_segment(r: int, f: int, m: int, avg_gift: float, segment_avg: float) -> str:
    """
    Map RFM scores to a segment name.

    High Potential: recent (R≥3), frequent (F≥3), but below-average gift
    Champion:       recent (R≥3), frequent (F≥3), above-average gift
    At Risk:        once-frequent but now lapsed (F≥2, R≤2)
    Lapsed:         everything else
    """
    if r >= 3 and f >= 3:
        return "High Potential" if avg_gift < segment_avg else "Champion"
    if f >= 2 and r <= 2:
        return "At Risk"
    return "Lapsed"


def upgrade_score(r: int, f: int, m: int, avg_gift: float, segment_avg: float) -> float:
    """
    Composite upgrade score [0, 1].
    Highest for donors who are recent + frequent + below average gift.
    """
    gap = max(0.0, segment_avg - avg_gift)
    gap_norm = gap / (segment_avg + 1e-6)   # how far below average they are
    rfm_base = (r + f) / 8.0                 # recency + frequency normalized to [0, 1]
    return float(np.clip(rfm_base * gap_norm, 0.0, 1.0))


def main():
    print("Loading data from Supabase...")
    supporters, donations = load_supabase()

    now = pd.Timestamp.now(tz="UTC")
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], utc=True)

    # ── Aggregate per supporter (monetary donations only for M score) ──────────
    monetary = donations[donations["donation_type"] == "Monetary"].copy()
    all_agg = donations.groupby("supporter_id").agg(
        total_donations=("donation_id", "count"),
        last_donation_date=("donation_date", "max"),
        first_donation_date=("donation_date", "min"),
        n_campaigns=("campaign_name", "nunique"),
    ).reset_index()

    mon_agg = monetary.groupby("supporter_id").agg(
        avg_gift=("amount", "mean"),
        total_monetary=("amount", "sum"),
    ).reset_index()

    agg = all_agg.merge(mon_agg, on="supporter_id", how="left")
    agg["avg_gift"] = agg["avg_gift"].fillna(0.0)
    agg["total_monetary"] = agg["total_monetary"].fillna(0.0)
    agg["days_since_last"] = (now - agg["last_donation_date"]).dt.days

    # ── Active donors only ─────────────────────────────────────────────────────
    active_ids = set(supporters[supporters["status"] == "Active"]["supporter_id"].tolist())
    agg = agg[agg["supporter_id"].isin(active_ids)].copy()

    # Need at least 3 donors per quartile to use qcut → require minimum size
    if len(agg) < 8:
        print(f"Too few donors ({len(agg)}) for RFM segmentation. Skipping.")
        return

    print(f"Computing RFM scores for {len(agg)} active donors...")
    agg = rfm_score(agg)

    segment_avg_gift = float(agg["avg_gift"].median())
    scored_at = datetime.now(timezone.utc).isoformat()

    records = []
    for _, row in agg.iterrows():
        r, f, m = int(row["r_score"]), int(row["f_score"]), int(row["m_score"])
        avg = float(row["avg_gift"])
        segment = assign_segment(r, f, m, avg, segment_avg_gift)
        score   = upgrade_score(r, f, m, avg, segment_avg_gift)

        records.append({
            "supporter_id":    int(row["supporter_id"]),
            "rfm_segment":     segment,
            "upgrade_candidate": segment == "High Potential",
            "upgrade_score":   round(score, 4),
            "current_avg_gift": round(avg, 2),
            "segment_avg_gift": round(segment_avg_gift, 2),
            "scored_at":       scored_at,
        })

    df_out = pd.DataFrame(records)
    n_candidates = df_out["upgrade_candidate"].sum()
    print(f"Segments: {df_out['rfm_segment'].value_counts().to_dict()}")
    print(f"Upgrade candidates: {n_candidates}")

    print("Writing upgrade scores to Supabase...")
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    client = create_client(url, key)
    client.table("donor_upgrade_scores").upsert(df_out.to_dict(orient="records")).execute()
    print(f"Done. Wrote {len(records)} upgrade score records.")


if __name__ == "__main__":
    main()
