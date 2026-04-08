"""
Training job — trains explanatory and recommendation models, saves artifacts.

Usage
-----
    python -m jobs.train_model
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score, train_test_split

# ── Path setup (run from social_media_analytics/ or repo root) ───────────────
PIPELINE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PIPELINE_ROOT))

from src.config import (
    EXPLANATORY_MODEL_PATH,
    FEATURE_COLS_PATH,
    MODELS_DIR,
    POST_PUB_FEATURES,
    PRE_PUB_FEATURES,
    RECOMMENDATION_MODEL_PATH,
    RUN_META_PATH,
    RUNS_DIR,
    SEED,
    TARGET_BINARY,
    TARGET_LOG,
    TEST_SIZE,
)
from src.data_io import load_csv
from src.features import build_targets, engineer_features, get_feature_sets
from src.metrics import report_two_stage
from src.modeling import (
    TwoStageModel,
    build_preprocessor,
    get_candidate_classifiers,
    get_candidate_regressors,
)


def _select_best(candidates: dict, X, y, scoring: str, cv) -> tuple[str, float, object]:
    best_name, best_score, best_pipe = None, -np.inf, None
    for name, pipe in candidates.items():
        scores = cross_val_score(pipe, X, y, cv=cv, scoring=scoring, n_jobs=-1)
        print(f"    {name}: {scoring} {scores.mean():.4f} ± {scores.std():.4f}")
        if scores.mean() > best_score:
            best_name, best_score, best_pipe = name, scores.mean(), pipe
    return best_name, best_score, best_pipe


def _build_two_stage(X_train, y_binary_train, y_log_train, feature_cols: list[str]) -> TwoStageModel:
    numeric_cols     = X_train.select_dtypes(include="number").columns.tolist()
    categorical_cols = X_train.select_dtypes(exclude="number").columns.tolist()

    cv_clf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    cv_reg = KFold(n_splits=5, shuffle=True, random_state=SEED)

    print("  Stage 1 — classifier CV (roc_auc):")
    prep_clf = build_preprocessor(numeric_cols, categorical_cols)
    clf_name, clf_score, best_clf = _select_best(
        get_candidate_classifiers(prep_clf), X_train, y_binary_train, "roc_auc", cv_clf
    )
    print(f"  → Best Stage 1: {clf_name}  (ROC AUC {clf_score:.4f})")

    print("  Stage 2 — regressor CV on positives (r2):")
    pos_mask = y_binary_train.values == 1
    X_pos    = X_train[pos_mask]
    y_pos    = y_log_train.values[pos_mask]
    prep_reg = build_preprocessor(numeric_cols, categorical_cols)
    reg_name, reg_score, best_reg = _select_best(
        get_candidate_regressors(prep_reg), X_pos, y_pos, "r2", cv_reg
    )
    print(f"  → Best Stage 2: {reg_name}  (R² {reg_score:.4f})")

    model = TwoStageModel(classifier=best_clf, regressor=best_reg)
    model.fit(X_train, y_binary_train, y_log_train)
    return model, clf_name, clf_score, reg_name, reg_score


def main():
    print("[1/5] Loading data...")
    df = load_csv()
    print(f"    {len(df):,} rows loaded.")

    print("[2/5] Engineering features and targets...")
    df = engineer_features(df)
    df = build_targets(df)
    pre_pub, post_pub = get_feature_sets(df)

    # ── Train / test split (stratified on has_donation) ───────────────────────
    all_features = list(dict.fromkeys(pre_pub + post_pub))  # preserve order, no dupes
    df_model = df.dropna(subset=all_features + [TARGET_BINARY, TARGET_LOG]).reset_index(drop=True)

    X = df_model[all_features]
    y_bin = df_model[TARGET_BINARY]
    y_log = df_model[TARGET_LOG]

    X_train, X_test, yb_train, yb_test, yl_train, yl_test = train_test_split(
        X, y_bin, y_log, test_size=TEST_SIZE, random_state=SEED, stratify=y_bin
    )
    print(f"    Train: {len(X_train):,}  |  Test: {len(X_test):,}")
    print(f"    Positive rate (train): {yb_train.mean():.1%}")

    # ── Explanatory model (all features) ─────────────────────────────────────
    print("\n[3/5] Training explanatory model (pre-pub + post-pub features)...")
    expl_model, e_clf, e_clf_sc, e_reg, e_reg_sc = _build_two_stage(
        X_train[all_features], yb_train, yl_train, all_features
    )

    print("\n  Evaluation on held-out test set:")
    yb_pred  = expl_model.predict_stage1(X_test[all_features])
    yb_proba = expl_model.predict_proba_stage1(X_test[all_features])
    pos_mask_test = yb_test.values == 1
    yl_pred_pos   = expl_model.predict_stage2(X_test[all_features][pos_mask_test])
    report_two_stage(yb_test, yb_pred, yb_proba, yl_test.values[pos_mask_test], yl_pred_pos)

    # ── Recommendation model (pre-pub features only) ──────────────────────────
    print("[4/5] Training recommendation model (pre-pub features only)...")
    rec_model, r_clf, r_clf_sc, r_reg, r_reg_sc = _build_two_stage(
        X_train[pre_pub], yb_train, yl_train, pre_pub
    )

    # ── Save artifacts ────────────────────────────────────────────────────────
    print("\n[5/5] Saving artifacts...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    FEATURE_COLS_PATH.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump({"model": expl_model, "feature_cols": all_features}, EXPLANATORY_MODEL_PATH)
    print(f"    Saved → {EXPLANATORY_MODEL_PATH}")

    joblib.dump({"model": rec_model, "feature_cols": pre_pub}, RECOMMENDATION_MODEL_PATH)
    print(f"    Saved → {RECOMMENDATION_MODEL_PATH}")

    feature_cols_meta = {"explanatory": all_features, "recommendation": pre_pub}
    with open(FEATURE_COLS_PATH, "w") as f:
        json.dump(feature_cols_meta, f, indent=2)
    print(f"    Saved → {FEATURE_COLS_PATH}")

    run_meta = {
        "trained_at":              datetime.now(timezone.utc).isoformat(),
        "n_train":                 len(X_train),
        "n_test":                  len(X_test),
        "positive_rate_train":     round(float(yb_train.mean()), 4),
        "explanatory": {
            "stage1_model":        e_clf,
            "stage1_cv_roc_auc":   round(e_clf_sc, 4),
            "stage2_model":        e_reg,
            "stage2_cv_r2":        round(e_reg_sc, 4),
            "n_features":          len(all_features),
        },
        "recommendation": {
            "stage1_model":        r_clf,
            "stage1_cv_roc_auc":   round(r_clf_sc, 4),
            "stage2_model":        r_reg,
            "stage2_cv_r2":        round(r_reg_sc, 4),
            "n_features":          len(pre_pub),
        },
    }
    with open(RUN_META_PATH, "w") as f:
        json.dump(run_meta, f, indent=2)
    print(f"    Saved → {RUN_META_PATH}")
    print("\nDone.")


if __name__ == "__main__":
    main()
