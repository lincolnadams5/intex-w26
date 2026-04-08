from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# ── Directory layout ─────────────────────────────────────────────────────────
DATA_RAW       = ROOT / "data" / "raw"
DATA_INTERIM   = ROOT / "data" / "interim"
DATA_PROCESSED = ROOT / "data" / "processed"

ARTIFACTS_DIR = ROOT / "artifacts"
MODELS_DIR    = ARTIFACTS_DIR / "models"
RUNS_DIR      = ARTIFACTS_DIR / "runs"

REPORTS_DIR = ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
LOGS_DIR    = ROOT / "logs"

# ── Source data ───────────────────────────────────────────────────────────────
# CSV lives in the shared datasets/ folder one level above this pipeline root
SOURCE_CSV = ROOT.parent / "datasets" / "social_media_posts.csv"

# ── Supabase table names ──────────────────────────────────────────────────────
SUPABASE_TABLE        = "social_media_posts"
SUPABASE_SCORES_TABLE = "post_analytics_scores"

# ── Saved artifact paths ──────────────────────────────────────────────────────
EXPLANATORY_MODEL_PATH    = MODELS_DIR / "explanatory_model.joblib"
RECOMMENDATION_MODEL_PATH = MODELS_DIR / "recommendation_model.joblib"
FEATURE_COLS_PATH         = DATA_PROCESSED / "feature_cols.json"
RUN_META_PATH             = RUNS_DIR / "latest_run.json"

# ── Modeling constants ────────────────────────────────────────────────────────
SEED               = 42
TEST_SIZE          = 0.2
DONATION_THRESHOLD = 0  # estimated_donation_value_php > 0 → has_donation = 1

# ── Target columns ────────────────────────────────────────────────────────────
TARGET_VALUE     = "estimated_donation_value_php"
TARGET_REFERRALS = "donation_referrals"
TARGET_BINARY    = "has_donation"       # engineered: value > DONATION_THRESHOLD
TARGET_LOG       = "log_donation_value" # engineered: log1p(TARGET_VALUE)

# ── Feature definitions ───────────────────────────────────────────────────────

# Available BEFORE publishing — what the org controls when planning a post.
PRE_PUB_FEATURES = [
    "platform",
    "post_type",
    "media_type",
    "sentiment_tone",
    "has_call_to_action",
    "call_to_action_type",
    "post_hour",
    "day_of_week",
    "num_hashtags",
    "caption_length",
    "is_boosted",
    "features_resident_story",
    "content_topic",
    # engineered
    "is_peak_hour",
    "is_peak_day",
    "has_video_content",
    "is_impact_or_fundraising",
]

# Available AFTER publishing — post-publication engagement metrics.
# Used in the explanatory model only. NOT in the recommendation model.
POST_PUB_FEATURES = [
    "engagement_rate",
    "shares",
    "likes",
    "reach",
    "impressions",
    "saves",
    "click_throughs",
    "profile_visits",
    "video_views",
    "forwards",
    "engagement_per_follower",
]

# Excluded entirely — identifiers, free text, sparse platform-specific columns.
EXCLUDE_COLS = [
    "post_id",
    "platform_post_id",
    "post_url",
    "created_at",
    "caption",
    "hashtags",
    "mentions_count",
    "boost_budget_php",
    "campaign_name",
    "watch_time_seconds",
    "avg_view_duration_seconds",
    "subscriber_count_at_post",
    "follower_count_at_post",  # only used to derive engagement_per_follower
]

# ── Inference output tiers ────────────────────────────────────────────────────
VALUE_TIERS = [
    (50_000, "High Impact"),
    (10_000, "Moderate Impact"),
    (1_000,  "Low Impact"),
    (0,      "Minimal Impact"),
]
