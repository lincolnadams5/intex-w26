from pathlib import Path

# --- Paths ---
ROOT             = Path(__file__).resolve().parents[1]
DATA_RAW         = ROOT / "data" / "raw"
DATA_INTERIM     = ROOT / "data" / "interim"
DATA_PROCESSED   = ROOT / "data" / "processed"
ARTIFACTS_MODELS = ROOT / "artifacts" / "models"
ARTIFACTS_RUNS   = ROOT / "artifacts" / "runs"
REPORTS          = ROOT / "reports"
LOGS             = ROOT / "logs"

# Datasets directory (pipeline/datasets/)
DATASETS_DIR = ROOT.parent / "datasets"

# --- Source CSV filenames ---
RESIDENTS_FILE   = "residents.csv"
HEALTH_FILE      = "health_wellbeing_records.csv"
EDUCATION_FILE   = "education_records.csv"
SESSIONS_FILE    = "process_recordings.csv"
VISITATIONS_FILE = "home_visitations.csv"
PLANS_FILE       = "intervention_plans.csv"
INCIDENTS_FILE   = "incident_reports.csv"

# --- Modeling constants ---
SEED      = 42
TEST_SIZE = 0.20
CV_FOLDS  = 5

# --- Target ---
TARGET         = "reintegration_ready"
POSITIVE_CLASS = 1  # Completed = 1 (Ready for reintegration)

# Label mapping: In Progress residents are excluded from training, scored at inference
LABEL_MAP = {
    "Completed":   1,
    "Not Started": 0,
    "On Hold":     0,
}

# --- Risk level encoding (ordinal) ---
RISK_LEVELS = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}

# --- Emotional state encoding ---
POSITIVE_EMOTIONS = {"Hopeful", "Happy", "Calm"}

# --- Family cooperation encoding (ordinal) ---
COOPERATION_MAP = {
    "Uncooperative":     0,
    "Neutral":           1,
    "Cooperative":       2,
    "Highly Cooperative": 3,
}

# --- Supabase tables ---
RESIDENTS_TABLE    = "residents"
PREDICTIONS_TABLE  = "resident_reintegration_scores"
