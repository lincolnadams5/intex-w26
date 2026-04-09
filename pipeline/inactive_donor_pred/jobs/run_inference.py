"""
Inference job — loads saved model, scores all active donors, writes to Supabase.
Run: python -m jobs.run_inference
"""
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.config import ARTIFACTS_MODELS
from src.data_io import load_supabase, write_predictions_supabase
from src.features import build_donation_features

# ── Human-readable labels for each feature ────────────────────────────────────
FEATURE_LABELS = {
    "total_donations":           "low donation count",
    "total_estimated_value":     "low total giving",
    "mean_estimated_value":      "small average gift",
    "has_recurring":             "no recurring gift",
    "n_campaigns":               "few campaigns supported",
    "n_channels":                "few giving channels",
    "monetary_donations":        "few monetary donations",
    "time_donations":            "few time/volunteer donations",
    "inkind_donations":          "few in-kind donations",
    "donor_tenure_days":         "short donor tenure",
    "avg_days_between_donations":"long gaps between gifts",
    "supporter_tenure_days":     "short supporter tenure",
}


def get_top_reasons(shap_row: np.ndarray, feature_names: list[str], top_n: int = 3) -> list[str]:
    """
    Given a SHAP values row (1-D or 2-D) for one sample and the
    corresponding feature names (post-preprocessing), return the top_n
    most influential features as human-readable strings.

    For one-hot-encoded features (prefixed with 'cat__'), group by
    original feature name and sum absolute SHAP values.
    """
    row = np.array(shap_row)
    # If 2-D (n_features × n_classes), reduce to 1-D by summing abs over classes
    if row.ndim > 1:
        row = np.abs(row).sum(axis=-1)
    row = row.flatten()

    # Build a dict: original_feature_name → total |shap|
    contrib: dict[str, float] = {}
    for val, name in zip(row, feature_names):
        # ColumnTransformer prefixes: "num__<feat>" or "cat__<feat>_<value>"
        if name.startswith("num__"):
            orig = name[5:]
        elif name.startswith("cat__"):
            orig = name[5:].rsplit("_", 1)[0]
        else:
            orig = name
        contrib[orig] = contrib.get(orig, 0.0) + abs(float(val))

    top = sorted(contrib.items(), key=lambda x: x[1], reverse=True)[:top_n]
    reasons = []
    for feat, _ in top:
        label = FEATURE_LABELS.get(feat, feat.replace("_", " "))
        reasons.append(label)
    return reasons


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

    df_active["risk_score"] = model.predict_proba(X)[:, 1]
    df_active["at_risk_pred"] = model.predict(X).astype(int)
    df_active["scored_at"] = datetime.now(timezone.utc).isoformat()

    # ── SHAP explanations ──────────────────────────────────────────────────────
    print("Computing SHAP explanations...")
    try:
        import shap

        preprocessor = model[:-1]   # ColumnTransformer
        classifier   = model[-1]    # LogisticRegression or RandomForest

        X_transformed = preprocessor.transform(X)
        feature_names = list(preprocessor.get_feature_names_out())

        # Choose explainer based on classifier type
        clf_type = type(classifier).__name__
        if clf_type == "RandomForestClassifier":
            explainer = shap.TreeExplainer(classifier)
            shap_values = explainer.shap_values(X_transformed)
            # shap_values is [class0_array, class1_array]
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
        else:
            # LogisticRegression or any linear model
            background = shap.maskers.Independent(X_transformed, max_samples=min(100, len(X_transformed)))
            explainer = shap.LinearExplainer(classifier, background)
            shap_values = explainer.shap_values(X_transformed)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

        shap_array = np.array(shap_values)
        n_samples = X_transformed.shape[0]
        n_feats   = X_transformed.shape[1]

        # Normalize to (n_samples, n_features)
        if shap_array.ndim == 3:
            # (n_classes, n_samples, n_features) → take class 1
            if shap_array.shape[0] == 2:
                shap_array = shap_array[1]
            # (n_samples, n_features, n_classes) → sum abs over last axis
            elif shap_array.shape[2] == 2:
                shap_array = np.abs(shap_array).sum(axis=-1)
            else:
                shap_array = np.abs(shap_array).sum(axis=0)

        # If transposed (n_features, n_samples), flip it
        if shap_array.shape[0] == n_feats and shap_array.shape[-1] == n_samples:
            shap_array = shap_array.T

        reasons_list = [
            json.dumps(get_top_reasons(shap_array[i], feature_names))
            for i in range(n_samples)
        ]
        df_active["risk_reasons"] = reasons_list
        print(f"SHAP explanations computed for {len(df_active)} donors.")

    except Exception as e:
        import traceback
        print(f"Warning: SHAP explanations skipped. Full error:")
        traceback.print_exc()
        df_active["risk_reasons"] = None

    shap_ok = "risk_reasons" in df_active.columns and df_active["risk_reasons"].notna().any()
    output_cols = ["supporter_id", "risk_score", "at_risk_pred", "scored_at"]
    if shap_ok:
        output_cols.append("risk_reasons")
    output = df_active[output_cols].dropna(subset=["supporter_id"]).copy()
    output["supporter_id"] = output["supporter_id"].astype(int)
    print(f"Scored {len(output)} active donors. Writing to Supabase...")
    write_predictions_supabase(output)
    print("Done.")


if __name__ == "__main__":
    main()
