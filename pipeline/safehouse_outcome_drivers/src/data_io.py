"""
data_io.py — Loading, joining, and feature derivation for the safehouse outcome
drivers pipeline.

Public API
----------
    load_raw()    -> (metrics_df, safehouses_df, residents_df)
    load_panel()  -> modeling-ready panel DataFrame
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .config import (
    DATASETS_DIR,
    METRICS_FILE,
    OUTCOME_EDUCATION,
    OUTCOME_HEALTH,
    REGION_REFERENCE,
    RESIDENTS_FILE,
    SAFEHOUSE_FILE,
)


# ── Public: raw CSVs ───────────────────────────────────────────────────────────

def load_raw() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Load the three source CSVs with date columns parsed.

    Returns
    -------
    metrics, safehouses, residents : pd.DataFrame
    """
    metrics = pd.read_csv(
        DATASETS_DIR / METRICS_FILE,
        parse_dates=["month_start", "month_end"],
    )
    safehouses = pd.read_csv(
        DATASETS_DIR / SAFEHOUSE_FILE,
        parse_dates=["open_date"],
    )
    residents = pd.read_csv(
        DATASETS_DIR / RESIDENTS_FILE,
        parse_dates=["date_of_admission", "date_closed"],
    )
    return metrics, safehouses, residents


# ── Private: resident time-slice join ─────────────────────────────────────────

def _resident_snapshot(
    metrics: pd.DataFrame,
    residents: pd.DataFrame,
) -> pd.DataFrame:
    """
    For each (safehouse_id, month) row in *metrics*, derive resident-based
    features from a point-in-time snapshot.

    "Active in month" :=
        date_of_admission <= month_end
        AND (date_closed is NaT  OR  date_closed >= month_start)

    Columns returned (keyed by metric_id):
        pct_high_risk     — % active with current_risk_level == 'High'
        pct_trafficked    — % active with sub_cat_trafficked == True
        pct_special_needs — % active with has_special_needs == True
        snapshot_n        — head-count of matched residents (for Phase 2 validation)

    Limitation: current_risk_level is a today's-snapshot field; it does not
    reflect each resident's historical risk level at each month. Flagged as a
    known limitation in Phase 5.
    """
    records = []

    for _, row in metrics.iterrows():
        active = residents[
            (residents["safehouse_id"] == row["safehouse_id"])
            & (residents["date_of_admission"] <= row["month_end"])
            & (
                residents["date_closed"].isna()
                | (residents["date_closed"] >= row["month_start"])
            )
        ]

        n = len(active)
        if n == 0:
            records.append({
                "metric_id":        row["metric_id"],
                "pct_high_risk":     np.nan,
                "pct_trafficked":    np.nan,
                "pct_special_needs": np.nan,
                "snapshot_n":        0,
            })
        else:
            # astype(str) handles both Python bool and "True"/"False" string dtypes
            records.append({
                "metric_id":         row["metric_id"],
                "pct_high_risk":     (active["current_risk_level"].astype(str) == "High").sum() / n * 100,
                "pct_trafficked":    (active["sub_cat_trafficked"].astype(str)  == "True").sum() / n * 100,
                "pct_special_needs": (active["has_special_needs"].astype(str)   == "True").sum() / n * 100,
                "snapshot_n":        n,
            })

    return pd.DataFrame(records)


# ── Public: modeling-ready panel ──────────────────────────────────────────────

def load_panel(
    drop_null_outcomes: bool = True,
    verbose: bool = True,
) -> pd.DataFrame:
    """
    Return the modeling-ready panel DataFrame.

    Steps
    -----
    1. Load raw CSVs.
    2. Drop rows where either outcome is NULL (startup gaps, reporting lags,
       future scaffold months with no labels yet).
    3. Join safehouse metadata (region, open_date, capacity_girls).
    4. Derive simple features from metrics columns.
    5. Derive resident-based features via per-month time-slice join.
    6. Add region indicator columns (REGION_REFERENCE is the baseline and is
       NOT added as a dummy column).
    7. Sort by safehouse_id, then month_start.

    Parameters
    ----------
    drop_null_outcomes : bool, default True
        Drop rows where avg_health_score or avg_education_progress is NULL.
    verbose : bool, default True
        Print progress and row-count summary.

    Returns
    -------
    pd.DataFrame
        Columns include all raw metrics fields plus:
        sessions_per_resident, visits_per_resident, occupancy_rate,
        months_since_start, pct_high_risk, pct_trafficked, pct_special_needs,
        snapshot_n (validation only), region_Visayas, region_Mindanao.
    """
    metrics, safehouses, residents = load_raw()

    if verbose:
        print(f"[data_io] Raw metrics : {len(metrics):,} rows")

    # ── 1. Drop rows without outcomes ─────────────────────────────────────────
    if drop_null_outcomes:
        mask   = metrics[OUTCOME_HEALTH].notna() & metrics[OUTCOME_EDUCATION].notna()
        n_drop = (~mask).sum()
        metrics = metrics[mask].copy()
        if verbose:
            print(
                f"[data_io] Dropped {n_drop} NULL-outcome rows "
                f"(startup gaps + reporting lags + future scaffold). "
                f"Remaining: {len(metrics):,}"
            )

    # ── 2. Join safehouse metadata ────────────────────────────────────────────
    df = metrics.merge(
        safehouses[["safehouse_id", "region", "open_date", "capacity_girls"]],
        on="safehouse_id",
        how="left",
    )

    # ── 3. Simple derived features ────────────────────────────────────────────
    df["sessions_per_resident"] = df["process_recording_count"] / df["active_residents"]
    df["visits_per_resident"]   = df["home_visitation_count"]   / df["active_residents"]
    df["occupancy_rate"]        = df["active_residents"]        / df["capacity_girls"]
    df["months_since_start"]    = (
        (df["month_start"].dt.year  - df["open_date"].dt.year) * 12
        + (df["month_start"].dt.month - df["open_date"].dt.month)
    )

    # ── 4. Resident-based features (time-slice join) ──────────────────────────
    if verbose:
        print("[data_io] Building resident time-slice features …")
    res_feats = _resident_snapshot(metrics, residents)
    df = df.merge(res_feats, on="metric_id", how="left")

    # ── 5. Region dummies (REGION_REFERENCE = baseline, not added) ────────────
    for region in sorted(df["region"].unique()):
        if region != REGION_REFERENCE:
            col = f"region_{region.replace(' ', '_')}"
            df[col] = (df["region"] == region).astype(int)

    # ── 6. Sort panel ─────────────────────────────────────────────────────────
    df = df.sort_values(["safehouse_id", "month_start"]).reset_index(drop=True)

    # ── 7. Lag-1 features (program inputs → outcomes one month later) ──────────
    LAG_COLS = [
        "sessions_per_resident",
        "visits_per_resident",
        "pct_high_risk",
        "pct_trafficked",
        "pct_special_needs",
    ]
    for col in LAG_COLS:
        df[f"{col}_lag1"] = df.groupby("safehouse_id")[col].shift(1)

    # Drop the first observation per safehouse (lag is undefined there)
    first_obs_mask = df.groupby("safehouse_id").cumcount() == 0
    n_dropped_lag  = first_obs_mask.sum()
    df = df[~first_obs_mask].reset_index(drop=True)
    if verbose:
        print(
            f"[data_io] Dropped {n_dropped_lag} first-obs-per-safehouse rows "
            f"(lag-1 undefined). Remaining: {len(df):,}"
        )

    if verbose:
        print(f"[data_io] Panel ready: {len(df):,} rows × {len(df.columns)} columns")

    return df
