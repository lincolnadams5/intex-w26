"""
run_regression.py — Weekly regression job for the safehouse outcome drivers pipeline.

Runs every Sunday at midnight UTC via GitHub Actions.

Steps
-----
1. Regenerate the modeling-ready panel from source CSVs.
2. Fit both PanelOLS models (health + education).
3. Extract coefficient table and flagged-safehouse report.
4. Truncate + insert both Supabase tables (full replace each run).

Tables written
--------------
    safehouse_outcome_coefficients  — one row per feature, per run
    safehouse_outcome_drivers       — one row per safehouse, per run

Environment variables required
-------------------------------
    SUPABASE_URL
    SUPABASE_KEY
"""

from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

# ── Path setup (importable whether run as __main__ or -m jobs.run_regression) ─
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
from supabase import create_client, Client

from src.config import DATASETS_DIR, DATA_PROCESSED, PANEL_READY_FILE, SCALER_STATS_FILE
from src.data_io import load_panel
from src.features import build_model_matrix
from src.modeling import (
    build_panel_index,
    run_panel_ols,
    extract_coef_table,
    compute_residuals,
    MODEL_FEATURES_STD,
)
from src.evaluation import flag_safehouses_report

load_dotenv(ROOT / ".env")


# ── Supabase client ───────────────────────────────────────────────────────────

def _get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_KEY must be set in environment or .env"
        )
    return create_client(url, key)


# ── Table helpers ─────────────────────────────────────────────────────────────

def _truncate(client: Client, table: str) -> None:
    """Delete all rows from *table* (full replace semantics)."""
    client.table(table).delete().gte("id", 0).execute()
    print(f"  Truncated: {table}")


def _insert(client: Client, table: str, rows: list[dict]) -> None:
    client.table(table).insert(rows).execute()
    print(f"  Inserted {len(rows)} rows -> {table}")


# ── Push functions ────────────────────────────────────────────────────────────

def push_coefficients(client: Client, coef_table, run_date: str) -> None:
    """
    Push coefficient table to safehouse_outcome_coefficients.

    Schema
    ------
    id          bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY
    run_date    date    NOT NULL
    feature     text    NOT NULL
    beta_health numeric
    se_health   numeric
    p_health    numeric
    sig_health  text
    beta_edu    numeric
    se_edu      numeric
    p_edu       numeric
    sig_edu     text
    """
    rows = []
    for feat, row in coef_table.iterrows():
        rows.append({
            "run_date":    run_date,
            "feature":     feat.replace("_std", ""),
            "beta_health": _safe(row.get("beta_A")),
            "se_health":   _safe(row.get("se_A")),
            "p_health":    _safe(row.get("p_A")),
            "sig_health":  row.get("sig_A", ""),
            "beta_edu":    _safe(row.get("beta_B")),
            "se_edu":      _safe(row.get("se_B")),
            "p_edu":       _safe(row.get("p_B")),
            "sig_edu":     row.get("sig_B", ""),
        })
    _truncate(client, "safehouse_outcome_coefficients")
    _insert(client, "safehouse_outcome_coefficients", rows)


def push_drivers(client: Client, flagged_report, run_date: str) -> None:
    """
    Push flagged-safehouse report to safehouse_outcome_drivers.

    Schema
    ------
    id              bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY
    run_date        date    NOT NULL
    safehouse_id    integer NOT NULL
    region          text
    var_health      numeric
    var_edu         numeric
    flagged_health  boolean
    flagged_edu     boolean
    flagged_for     text
    note            text
    """
    rows = []
    for _, row in flagged_report.iterrows():
        rows.append({
            "run_date":       run_date,
            "safehouse_id":   int(row["safehouse_id"]),
            "region":         str(row["region"]),
            "var_health":     _safe(row["var_A"]),
            "var_edu":        _safe(row["var_B"]),
            "flagged_health": bool(row["var_A_flag"]),
            "flagged_edu":    bool(row["var_B_flag"]),
            "flagged_for":    str(row["flagged_for"]),
            "note":           str(row["note"]),
        })
    _truncate(client, "safehouse_outcome_drivers")
    _insert(client, "safehouse_outcome_drivers", rows)


def _safe(val) -> float | None:
    """Convert NaN / None to None for JSON serialisation."""
    import math
    if val is None:
        return None
    try:
        return None if math.isnan(float(val)) else round(float(val), 6)
    except (TypeError, ValueError):
        return None


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    run_date = date.today().isoformat()
    print(f"[run_regression] Run date: {run_date}")

    # 1. Regenerate panel (always from source — picks up any new monthly rows)
    print("[run_regression] Building panel...")
    panel_df = load_panel(verbose=True)
    df, _, scaler_stats = build_model_matrix(panel_df)

    # Persist processed artifacts so notebooks stay in sync
    DATA_PROCESSED.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_PROCESSED / PANEL_READY_FILE, index=False)
    scaler_stats.to_csv(DATA_PROCESSED / SCALER_STATS_FILE, index=False)
    print(f"[run_regression] Panel: {len(df)} rows x {len(df.columns)} columns")

    # 2. Fit models
    print("[run_regression] Fitting models...")
    panel_indexed = build_panel_index(df)
    res_a = run_panel_ols(panel_indexed, "avg_health_score")
    res_b = run_panel_ols(panel_indexed, "avg_education_progress")
    print(f"[run_regression] Health    within-R2 = {res_a.rsquared:.4f}")
    print(f"[run_regression] Education within-R2 = {res_b.rsquared:.4f}")

    # 3. Extract outputs
    coef_table     = extract_coef_table(res_a, res_b)
    resid_by_sh    = compute_residuals(res_a, res_b)
    flagged_report = flag_safehouses_report(resid_by_sh, df)

    flagged = flagged_report[flagged_report["var_A_flag"] | flagged_report["var_B_flag"]]
    if len(flagged):
        print(f"[run_regression] Flagged safehouses: {flagged['safehouse_id'].tolist()}")
    else:
        print("[run_regression] No safehouses flagged.")

    # 4. Push to Supabase
    print("[run_regression] Connecting to Supabase...")
    client = _get_client()

    print("[run_regression] Pushing coefficients...")
    push_coefficients(client, coef_table, run_date)

    print("[run_regression] Pushing drivers (flagged safehouses)...")
    push_drivers(client, flagged_report, run_date)

    print("[run_regression] Done.")


if __name__ == "__main__":
    main()
