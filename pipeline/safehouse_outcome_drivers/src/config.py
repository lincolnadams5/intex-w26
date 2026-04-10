"""
Configuration for the safehouse outcome drivers pipeline.
"""

from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT             = Path(__file__).resolve().parents[1]
DATASETS_DIR     = ROOT.parent / "datasets"
DATA_PROCESSED   = ROOT / "data" / "processed"
ARTIFACTS_MODELS = ROOT / "artifacts" / "models"
ARTIFACTS_RUNS   = ROOT / "artifacts" / "runs"
REPORTS          = ROOT / "reports"
LOGS             = ROOT / "logs"

# ── Source CSV filenames ───────────────────────────────────────────────────────
SAFEHOUSE_FILE = "safehouses.csv"
METRICS_FILE   = "safehouse_monthly_metrics.csv"
RESIDENTS_FILE = "residents.csv"

# ── Outcome variable names ─────────────────────────────────────────────────────
OUTCOME_HEALTH    = "avg_health_score"
OUTCOME_EDUCATION = "avg_education_progress"

# ── Supabase / Postgres table names ───────────────────────────────────────────
DRIVERS_TABLE = "safehouse_outcome_drivers"
COEFS_TABLE   = "safehouse_outcome_coefficients"

# ── Modeling constants ─────────────────────────────────────────────────────────
SEED = 42

# Underperforming thresholds (residual = actual − predicted must be below these)
UNDERPERFORM_HEALTH_THRESHOLD    = -0.3
UNDERPERFORM_EDUCATION_THRESHOLD = -5.0

# Features included in the regression (order used in display tables).
# Contemporaneous features first, then 1-month lags.
# occupancy_rate excluded: absorbed by entity FE (fixed safehouse capacity).
REGRESSION_FEATURES = [
    "sessions_per_resident",
    "visits_per_resident",
    "pct_high_risk",
    "pct_trafficked",
    "pct_special_needs",
    "months_since_start",
    # 1-month lags: program inputs this month affect outcomes next month
    "sessions_per_resident_lag1",
    "visits_per_resident_lag1",
    "pct_high_risk_lag1",
    "pct_trafficked_lag1",
    "pct_special_needs_lag1",
]

# Reference region for dummy encoding (Luzon is baseline; dropped from formula)
REGION_REFERENCE = "Luzon"

# ── Processed data filenames (written by Phase 3) ─────────────────────────────
PANEL_READY_FILE  = "panel_model_ready.csv"
SCALER_STATS_FILE = "scaler_stats.csv"
COEF_TABLE_FILE   = "coef_table.csv"

# Success criteria (Phase 1)
R2_THRESHOLD_MIN = 0.50   # minimum acceptable R² for either model
SIG_COEFS_MIN    = 2      # minimum significant coefficients (p < 0.05) with expected sign
