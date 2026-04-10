"""
features.py — Feature engineering for the safehouse outcome drivers pipeline.

Public API
----------
    build_model_matrix(panel) -> (df, model_features, scaler_stats)

Phase 3 decisions (user-confirmed 2026-04-09)
---------------------------------------------
    - sessions_per_resident, visits_per_resident : log1p before z-scoring
      (right-skewed ratio features; log compresses the tail)
    - pct_high_risk, pct_trafficked, pct_special_needs : fill NaN with 0
      (NaN arises when time-slice join finds no resident records for a month;
       0 is the correct semantic — no residents → 0% in each category)
    - All 7 regression features : z-scored (mean=0, std=1)
      (standardised coefficients allow direct magnitude comparison
       across features in the Phase 4 coefficient table)
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .config import REGRESSION_FEATURES

# Features transformed before z-scoring (lag-1 versions get the same treatment)
FEATURES_LOG1P = [
    "sessions_per_resident",
    "visits_per_resident",
    "sessions_per_resident_lag1",
    "visits_per_resident_lag1",
]
FEATURES_FILL_ZERO = [
    "pct_high_risk",
    "pct_trafficked",
    "pct_special_needs",
    "pct_high_risk_lag1",
    "pct_trafficked_lag1",
    "pct_special_needs_lag1",
]


def build_model_matrix(
    panel: pd.DataFrame,
) -> tuple[pd.DataFrame, list[str], pd.DataFrame]:
    """
    Apply all Phase-3 transformations and return the modeling-ready matrix.

    Steps (applied per feature in REGRESSION_FEATURES order):
    1. log1p — applied to FEATURES_LOG1P before anything else.
    2. Fill NaN → 0 — applied to FEATURES_FILL_ZERO.
    3. Z-score — applied to all 7 features; result stored as ``{feat}_std``.

    The original columns in *panel* are never modified so callers can
    still access raw values for diagnostics and plots.

    Parameters
    ----------
    panel : pd.DataFrame
        Output of ``load_panel()``.

    Returns
    -------
    df : pd.DataFrame
        Copy of *panel* with ``{feat}_std`` columns appended.
    model_features : list[str]
        Ordered list of the ``_std`` column names — pass directly to the
        patsy formula string in Phase 4.
    scaler_stats : pd.DataFrame
        One row per feature. Columns: feature, log1p_applied, fill_zero,
        mean_before_std, std_before_std.
        Stored to disk in Phase 3 and reloaded in Phase 5 for coefficient
        back-transformation.
    """
    df = panel.copy()
    records: list[dict] = []

    for feat in REGRESSION_FEATURES:
        col = df[feat].copy()

        # Step 1: log1p for right-skewed ratio features
        log1p_applied = feat in FEATURES_LOG1P
        if log1p_applied:
            col = np.log1p(col)

        # Step 2: fill NaN with 0 for resident-proportion features
        fill_zero = feat in FEATURES_FILL_ZERO
        if fill_zero:
            col = col.fillna(0.0)

        # Step 3: z-score
        mu  = float(col.mean())
        std = float(col.std())
        df[f"{feat}_std"] = (col - mu) / std

        records.append({
            "feature":          feat,
            "log1p_applied":    log1p_applied,
            "fill_zero":        fill_zero,
            "mean_before_std":  round(mu,  6),
            "std_before_std":   round(std, 6),
        })

    model_features = [f"{f}_std" for f in REGRESSION_FEATURES]
    scaler_stats   = pd.DataFrame(records)
    return df, model_features, scaler_stats
