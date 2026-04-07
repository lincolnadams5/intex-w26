from pathlib import Path

# --- Paths ---
ROOT = Path(__file__).resolve().parents[1]
DATA_RAW = ROOT / "data" / "raw"
DATA_INTERIM = ROOT / "data" / "interim"
DATA_PROCESSED = ROOT / "data" / "processed"
ARTIFACTS_MODELS = ROOT / "artifacts" / "models"
ARTIFACTS_RUNS = ROOT / "artifacts" / "runs"
REPORTS = ROOT / "reports"
LOGS = ROOT / "logs"

# --- Source CSV filenames (raw) ---
SUPPORTERS_FILE = DATA_RAW / "supporters.csv"
DONATIONS_FILE = DATA_RAW / "donations.csv"

# --- Modeling constants ---
SEED = 42
TEST_SIZE = 0.2
AT_RISK_DAYS = 90          # label: no donation in this many days = at-risk
HISTORICAL_CUTOFF_DAYS = 180  # look-back window for historical label construction

# --- Target ---
TARGET = "at_risk"         # engineered binary label (1 = at risk of going inactive)
POSITIVE_CLASS = 1

# --- Supabase tables ---
SUPPORTERS_TABLE = "supporters"
DONATIONS_TABLE = "donations"
PREDICTIONS_TABLE = "donor_risk_scores"
