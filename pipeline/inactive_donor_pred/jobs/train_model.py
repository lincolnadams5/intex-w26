"""
Training job — pulls data from Supabase, engineers features, trains model, saves artifact.
Run: python -m jobs.train_model
"""
import json
import joblib
import pandas as pd
from datetime import datetime, timezone
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.model_selection import train_test_split

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import SEED, TEST_SIZE, AT_RISK_DAYS, TARGET, ARTIFACTS_MODELS, ARTIFACTS_RUNS
from src.data_io import load_supabase
from src.features import build_donation_features, add_label
from src.modeling import build_preprocessor, get_candidate_pipelines
from src.metrics import report_classification


def main():
    print("Loading data from Supabase...")
    supporters, donations = load_supabase()

    print("Engineering features and label...")
    df = build_donation_features(supporters, donations)
    df = add_label(df, at_risk_days=AT_RISK_DAYS)

    # Only train on currently-active donors
    df_active = df[df["status"] == "Active"].copy()

    EXCLUDE = ["supporter_id", "display_name", "organization_name", "first_name",
               "last_name", "email", "phone", "status", "created_at",
               "first_donation_date", "last_donation_date", "first_donation_date_d",
               "days_since_last_donation",  # direct proxy for the label — exclude
               TARGET]

    feature_cols = [c for c in df_active.columns if c not in EXCLUDE]
    X = df_active[feature_cols]
    y = df_active[TARGET]

    numeric_cols = X.select_dtypes(include="number").columns.tolist()
    categorical_cols = X.select_dtypes(exclude="number").columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=SEED, stratify=y
    )

    preprocessor = build_preprocessor(numeric_cols, categorical_cols)
    candidates = get_candidate_pipelines(preprocessor)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    best_name, best_score, best_pipe = None, -1, None

    for name, pipe in candidates.items():
        scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
        print(f"{name}: ROC AUC {scores.mean():.4f} ± {scores.std():.4f}")
        if scores.mean() > best_score:
            best_name, best_score, best_pipe = name, scores.mean(), pipe

    print(f"\nBest: {best_name} — fitting on full train set...")
    best_pipe.fit(X_train, y_train)

    y_pred = best_pipe.predict(X_test)
    y_prob = best_pipe.predict_proba(X_test)[:, 1]
    report_classification(y_test, y_pred, y_prob)

    # Save model
    ARTIFACTS_MODELS.mkdir(parents=True, exist_ok=True)
    model_path = ARTIFACTS_MODELS / "donor_risk_model.joblib"
    joblib.dump({"model": best_pipe, "feature_cols": feature_cols}, model_path)
    print(f"Model saved to {model_path}")

    # Save run metadata
    ARTIFACTS_RUNS.mkdir(parents=True, exist_ok=True)
    run_meta = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "best_model": best_name,
        "cv_roc_auc": round(best_score, 4),
        "at_risk_days": AT_RISK_DAYS,
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "feature_cols": feature_cols,
    }
    with open(ARTIFACTS_RUNS / "latest_run.json", "w") as f:
        json.dump(run_meta, f, indent=2)
    print("Run metadata saved.")


if __name__ == "__main__":
    main()
