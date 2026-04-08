"""
Inference job — loads saved model, scores all active donors, writes to Supabase.
Run: python -m jobs.run_inference
"""
import joblib
import pandas as pd
from datetime import datetime, timezone

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import ARTIFACTS_MODELS
from src.data_io import load_supabase, write_predictions_supabase
from src.features import build_donation_features


def main():
    model_path = ARTIFACTS_MODELS / "donor_risk_model.joblib"
    artifact = joblib.load(model_path)
    model = artifact["model"]
    feature_cols = artifact["feature_cols"]

    print("Loading live data from Supabase...")
    supporters, donations = load_supabase()

    print("Engineering features...")
    df = build_donation_features(supporters, donations)

    # Score all active donors
    df_active = df[df["status"] == "Active"].copy()
    X = df_active[feature_cols]

    df_active = df_active.copy()
    df_active["risk_score"] = model.predict_proba(X)[:, 1]
    df_active["at_risk_pred"] = model.predict(X)
    df_active["scored_at"] = datetime.now(timezone.utc).isoformat()

    output = df_active[["supporter_id", "risk_score", "at_risk_pred", "scored_at"]]
    print(f"Scored {len(output)} active donors. Writing to Supabase...")
    write_predictions_supabase(output)
    print("Done.")


if __name__ == "__main__":
    main()
