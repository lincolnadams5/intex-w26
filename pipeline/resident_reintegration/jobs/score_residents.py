"""
Inference job: score In Progress residents for reintegration readiness.

Usage
-----
# Score from local CSVs, print results:
    python jobs/score_residents.py

# Score from Supabase, write results back to Supabase:
    python jobs/score_residents.py --source supabase --sink supabase

# Score from CSVs, save output to CSV only:
    python jobs/score_residents.py --source csv --sink csv

Readiness bands
---------------
    0.00 – 0.30  ->  Low Readiness
    0.30 – 0.60  ->  Developing
    0.60 – 1.00  ->  Ready for Review

    Thresholds derived from validation against 39 labeled residents:
    completed residents score 0.55-0.78 (mean 0.69), not-ready score 0.19-0.53 (mean 0.33).
"""

import argparse
import os
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd

# ── Path setup (run from repo root or from pipeline/resident_reintegration/) ─
SCRIPT_DIR = Path(__file__).resolve().parent
PIPELINE_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(PIPELINE_ROOT))

from src.config import (
    ARTIFACTS_MODELS,
    DATA_PROCESSED,
    LOGS,
    PREDICTIONS_TABLE,
)
from src.data_io import load_all_csvs, load_from_supabase
from src.features import build_feature_matrix, add_label


# ── Readiness band thresholds ────────────────────────────────────────────────

BANDS = [
    (0.60, "Ready for Review"),
    (0.30, "Developing"),
    (0.00, "Low Readiness"),
]


def score_to_band(score: float) -> str:
    for threshold, label in BANDS:
        if score >= threshold:
            return label
    return "Low Readiness"


# ── Validation (score residents with known outcomes) ─────────────────────────

def run_validation(source: str) -> pd.DataFrame:
    print(f"[1/3] Loading data from {source}...")
    tables = load_all_csvs() if source == "csv" else load_from_supabase()

    df = build_feature_matrix(
        tables["residents"], tables["health"], tables["education"],
        tables["sessions"], tables["visitations"], tables["plans"], tables["incidents"],
    )
    df = add_label(df)

    labeled = df[df["reintegration_ready"].notna()].copy()
    print(f"    {len(labeled)} residents with known outcomes.")

    print("[2/3] Loading model and scoring...")
    model_path = ARTIFACTS_MODELS / "reintegration_model.joblib"
    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found at {model_path}.")

    artifact     = joblib.load(model_path)
    model        = artifact["model"]
    feature_cols = artifact["feature_cols"]

    X = labeled.reindex(columns=feature_cols)
    scores = model.predict_proba(X)[:, 1]

    results = pd.DataFrame({
        "resident_id":      labeled["resident_id"].values,
        "actual_status":    labeled["reintegration_status"].values,
        "actual_label":     labeled["reintegration_ready"].astype(int).values,
        "readiness_score":  scores.round(4),
        "readiness_band":   [score_to_band(s) for s in scores],
    }).sort_values("readiness_score", ascending=False).reset_index(drop=True)

    print("[3/3] Results:\n")

    for status, group in results.groupby("actual_status", sort=False):
        label = group["actual_label"].iloc[0]
        tag   = "Ready=1" if label == 1 else "Not Ready=0"
        print(f"  {status} ({tag}) — {len(group)} residents")
        print(f"    Score range : {group['readiness_score'].min():.4f} – {group['readiness_score'].max():.4f}")
        print(f"    Score mean  : {group['readiness_score'].mean():.4f}")
        band_counts = group["readiness_band"].value_counts()
        for band, count in band_counts.items():
            print(f"    {band:<22} : {count}")
        print()

    print("  Full table (sorted by score):")
    print(results.to_string(index=False))
    return results


# ── Core scoring logic ───────────────────────────────────────────────────────

def run_inference(source: str, sink: str, dry_run: bool = False) -> pd.DataFrame:
    # 1. Load data
    print(f"[1/4] Loading data from {source}...")
    if source == "supabase":
        tables = load_from_supabase()
    else:
        tables = load_all_csvs()

    residents    = tables["residents"]
    health_df    = tables["health"]
    edu_df       = tables["education"]
    sessions_df  = tables["sessions"]
    visits_df    = tables["visitations"]
    plans_df     = tables["plans"]
    incidents_df = tables["incidents"]

    print(f"    {len(residents)} residents loaded.")

    # 2. Build features and filter to In Progress only
    print("[2/4] Building feature matrix...")
    df = build_feature_matrix(
        residents, health_df, edu_df, sessions_df, visits_df, plans_df, incidents_df
    )
    df = add_label(df)

    in_progress = df[df["reintegration_status"] == "In Progress"].copy()
    print(f"    {len(in_progress)} In Progress residents to score.")

    if in_progress.empty:
        print("    No In Progress residents found — nothing to score.")
        return pd.DataFrame()

    # 3. Load model artifact and score
    print("[3/4] Loading model and scoring...")
    model_path = ARTIFACTS_MODELS / "reintegration_model.joblib"
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model artifact not found at {model_path}. "
            "Run notebooks 03 → 04 first to train and save the model."
        )

    artifact     = joblib.load(model_path)
    model        = artifact["model"]
    feature_cols = artifact["feature_cols"]

    # Align columns — fill any missing features with NaN (pipeline handles imputation)
    X_infer = in_progress.reindex(columns=feature_cols)

    scores = model.predict_proba(X_infer)[:, 1]

    results = pd.DataFrame({
        "resident_id":     in_progress["resident_id"].values,
        "readiness_score": scores.round(4),
        "readiness_band":  [score_to_band(s) for s in scores],
        "scored_at":       datetime.now(timezone.utc).isoformat(),
    }).sort_values("readiness_score", ascending=False).reset_index(drop=True)

    # 4. Write output
    print(f"[4/4] Writing results to sink: {sink}...")

    if sink in ("csv", "both"):
        LOGS.mkdir(parents=True, exist_ok=True)
        out_path = LOGS / "latest_scores.csv"
        results.to_csv(out_path, index=False)
        print(f"    Saved -> {out_path}")

    if sink in ("supabase", "both"):
        if dry_run:
            print("    [dry-run] Skipping Supabase write.")
        else:
            _write_to_supabase(results)

    return results


def _write_to_supabase(results: pd.DataFrame):
    try:
        from supabase import create_client
    except ImportError:
        raise ImportError("Install supabase-py: pip install supabase")

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    sb  = create_client(url, key)

    records = results.to_dict(orient="records")
    sb.table(PREDICTIONS_TABLE).upsert(records, on_conflict="resident_id").execute()
    print(f"    Upserted {len(records)} rows → {PREDICTIONS_TABLE}")


# ── CLI ──────────────────────────────────────────────────────────────────────

def _parse_args():
    parser = argparse.ArgumentParser(description="Score In Progress residents for reintegration readiness.")
    parser.add_argument(
        "--source", choices=["csv", "supabase"], default="csv",
        help="Where to load resident data from (default: csv)"
    )
    parser.add_argument(
        "--sink", choices=["csv", "supabase", "both"], default="csv",
        help="Where to write scores (default: csv -> logs/latest_scores.csv)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Skip all writes — just print the results."
    )
    parser.add_argument(
        "--validate", action="store_true",
        help="Score residents with known outcomes to check if model scores align with reality."
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()

    if args.validate:
        run_validation(source=args.source)
    else:
        results = run_inference(
            source=args.source,
            sink="csv" if args.dry_run else args.sink,
            dry_run=args.dry_run,
        )

        if not results.empty:
            print("\n=== READINESS SCORES ===")
            print(results.to_string(index=False))

            print("\n=== BAND SUMMARY ===")
            band_order = ["Ready for Review", "Approaching Ready", "Developing", "Low Readiness"]
            summary = (
                results["readiness_band"]
                .value_counts()
                .reindex(band_order, fill_value=0)
            )
            for band, count in summary.items():
                print(f"  {band:<22} : {count}")
