"""
Inference job — score all posts with the explanatory model.

Usage
-----
    # Score from CSV, print results (no writes):
    python -m jobs.run_inference --dry-run

    # Score from CSV, save output CSV:
    python -m jobs.run_inference --source csv --sink csv

    # Score from Supabase, write back to Supabase:
    python -m jobs.run_inference --source supabase --sink supabase

    # Score from CSV, write to both CSV and Supabase:
    python -m jobs.run_inference --source csv --sink both

Value tiers
-----------
    ≥ 50,000 PHP  →  High Impact
    ≥ 10,000 PHP  →  Moderate Impact
    ≥  1,000 PHP  →  Low Impact
    <  1,000 PHP  →  Minimal Impact
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd

# ── Path setup ────────────────────────────────────────────────────────────────
PIPELINE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PIPELINE_ROOT))

from src.config import (
    DATA_PROCESSED,
    EXPLANATORY_MODEL_PATH,
    LOGS_DIR,
    VALUE_TIERS,
)
from src.data_io import load_csv, load_supabase, write_scores_supabase
from src.features import build_targets, engineer_features


# ── Tier helper ───────────────────────────────────────────────────────────────

def value_to_tier(php: float) -> str:
    for threshold, label in VALUE_TIERS:
        if php >= threshold:
            return label
    return VALUE_TIERS[-1][1]  # Minimal Impact fallback


# ── Core inference ────────────────────────────────────────────────────────────

def run_inference(source: str, sink: str, dry_run: bool = False) -> pd.DataFrame:
    # 1. Load data
    print(f"[1/4] Loading data from {source}...")
    df = load_csv() if source == "csv" else load_supabase()
    print(f"    {len(df):,} posts loaded.")

    # 2. Engineer features
    print("[2/4] Engineering features...")
    df = engineer_features(df)
    df = build_targets(df)

    # 3. Load model and score
    print("[3/4] Loading model and scoring...")
    if not EXPLANATORY_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model artifact not found at {EXPLANATORY_MODEL_PATH}. "
            "Run `python -m jobs.train_model` first."
        )

    artifact     = joblib.load(EXPLANATORY_MODEL_PATH)
    model        = artifact["model"]
    feature_cols = artifact["feature_cols"]

    X = df.reindex(columns=feature_cols)

    p_donation      = model.predict_proba_stage1(X)
    predicted_value = model.predict(X)

    results = pd.DataFrame({
        "post_id":              df["post_id"],
        "predicted_value_php":  predicted_value.round(2),
        "p_has_donation":       p_donation.round(4),
        "value_tier":           [value_to_tier(v) for v in predicted_value],
        "scored_at":            datetime.now(timezone.utc).isoformat(),
    }).sort_values("predicted_value_php", ascending=False).reset_index(drop=True)

    # 4. Write output
    print(f"[4/4] Writing results to sink: {sink}...")

    if dry_run:
        print("  [dry-run] Skipping all writes.")
        print("\n=== SCORES (top 20) ===")
        print(results.head(20).to_string(index=False))
        return results

    if sink in ("csv", "both"):
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        out_path = LOGS_DIR / "latest_scores.csv"
        results.to_csv(out_path, index=False)
        print(f"    Saved → {out_path}")

    if sink in ("supabase", "both"):
        write_scores_supabase(results)

    return results


# ── CLI ───────────────────────────────────────────────────────────────────────

def _parse_args():
    parser = argparse.ArgumentParser(description="Score social media posts.")
    parser.add_argument(
        "--source", choices=["csv", "supabase"], default="csv",
        help="Data source (default: csv)"
    )
    parser.add_argument(
        "--sink", choices=["csv", "supabase", "both"], default="csv",
        help="Output destination (default: csv → logs/latest_scores.csv)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Score without writing any output."
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    results = run_inference(
        source=args.source,
        sink=args.sink,
        dry_run=args.dry_run,
    )

    if not args.dry_run and not results.empty:
        print("\n=== TIER SUMMARY ===")
        tier_order = [label for _, label in VALUE_TIERS]
        summary = (
            results["value_tier"]
            .value_counts()
            .reindex(tier_order, fill_value=0)
        )
        for tier, count in summary.items():
            print(f"  {tier:<20} : {count}")
