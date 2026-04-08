"""
FastAPI scoring endpoint for the recommendation model.

Loads recommendation_model.joblib once at startup, accepts pre-publication
post attributes, returns P(has_donation) and expected donation value in PHP.

Usage
-----
    cd pipeline/social_media_analytics
    uvicorn api.score_post:app --reload --port 8001

POST /score
    Body: JSON matching PostFeatures schema
    Returns: { "p_has_donation": float, "expected_value_php": float, "value_tier": str }

GET /health
    Returns model metadata from latest_run.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Path setup (works whether run from repo root or pipeline dir) ──────────────
PIPELINE_ROOT = Path(__file__).resolve().parents[1]
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

from src.config import (
    RECOMMENDATION_MODEL_PATH,
    RUNS_DIR,
    VALUE_TIERS,
)
from src.features import engineer_features

# ── Load model once at startup ────────────────────────────────────────────────
_bundle     = joblib.load(RECOMMENDATION_MODEL_PATH)
_model      = _bundle["model"]
_feat_cols  = _bundle["feature_cols"]   # ordered list of 17 pre-pub features

try:
    _run_meta = json.loads((RUNS_DIR / "latest_run.json").read_text(encoding="utf-8"))
except Exception:
    _run_meta = {}

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Lighthouse PH — Post Score API",
    description=(
        "Score a social media post *before* publishing. "
        "Returns the probability it generates any donation and the expected PHP value."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your frontend origin in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Request / response schemas ────────────────────────────────────────────────

class PostFeatures(BaseModel):
    """Pre-publication post attributes used by the recommendation model."""

    platform: str = Field(..., example="Facebook",
        description="Social media platform (Facebook, Instagram, Twitter, YouTube, TikTok, LinkedIn)")
    post_type: str = Field(..., example="ImpactStory",
        description="Type of post (ImpactStory, Announcement, EventPromo, Educational, etc.)")
    media_type: str = Field(..., example="Photo",
        description="Media type (Photo, Video, Reel, Story, Text, Carousel)")
    sentiment_tone: str = Field(..., example="Positive",
        description="Sentiment tone of the post (Positive, Neutral, Urgent, Inspirational, etc.)")
    has_call_to_action: int = Field(..., ge=0, le=1, example=1,
        description="1 if the post contains a call to action, 0 otherwise")
    call_to_action_type: str = Field(..., example="Donate",
        description="Type of CTA (Donate, Share, Volunteer, Learn More, None, etc.)")
    post_hour: int = Field(..., ge=0, le=23, example=10,
        description="Hour of day the post is scheduled (0–23)")
    day_of_week: str = Field(..., example="Monday",
        description="Day of week (Monday, Tuesday, ..., Sunday)")
    num_hashtags: int = Field(..., ge=0, example=5,
        description="Number of hashtags in the post")
    caption_length: int = Field(..., ge=0, example=220,
        description="Character count of the caption")
    is_boosted: int = Field(..., ge=0, le=1, example=0,
        description="1 if the post will be paid-boosted, 0 otherwise")
    features_resident_story: int = Field(..., ge=0, le=1, example=1,
        description="1 if the post features a resident's personal story")
    content_topic: str = Field(..., example="Fundraising",
        description="Primary content topic (Fundraising, Impact, Awareness, Events, etc.)")


class ScoreResponse(BaseModel):
    p_has_donation: float = Field(...,
        description="Probability this post generates any donation value (0–1)")
    expected_value_php: float = Field(...,
        description="Expected donation value in PHP (P(has_donation) × predicted value)")
    value_tier: str = Field(...,
        description="Human-readable tier: High Impact / Moderate Impact / Low Impact / Minimal Impact")
    feature_values: dict = Field(...,
        description="The engineered feature values sent to the model")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _value_to_tier(php: float) -> str:
    for threshold, label in VALUE_TIERS:
        if php >= threshold:
            return label
    return "Minimal Impact"


def _to_dataframe(features: PostFeatures) -> pd.DataFrame:
    """Convert the request body into a single-row DataFrame with engineered features."""
    row = features.model_dump()
    df  = pd.DataFrame([row])
    df  = engineer_features(df)
    # Keep only the feature columns the model was trained on, in the right order
    missing = [c for c in _feat_cols if c not in df.columns]
    for col in missing:
        df[col] = np.nan
    return df[_feat_cols]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    """Return model metadata and feature list."""
    rec_meta = _run_meta.get("recommendation", {})
    return {
        "status": "ok",
        "model_trained_at": _run_meta.get("trained_at"),
        "stage1_model": rec_meta.get("classifier"),
        "stage2_model": rec_meta.get("regressor"),
        "cv_stage1_roc_auc": rec_meta.get("cv_stage1_roc_auc"),
        "cv_stage2_r2": rec_meta.get("cv_stage2_r2"),
        "n_features": len(_feat_cols),
        "feature_cols": _feat_cols,
    }


@app.post("/score", response_model=ScoreResponse)
def score_post(features: PostFeatures) -> ScoreResponse:
    """
    Score a social media post before publishing.

    Returns the probability it generates any donation (Stage 1) and the
    expected donation value in PHP (Stage 1 × Stage 2 combined output).
    """
    try:
        X = _to_dataframe(features)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Feature construction failed: {exc}")

    try:
        p_donation     = float(_model.predict_proba_stage1(X)[0])
        expected_value = float(_model.predict(X)[0])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc}")

    return ScoreResponse(
        p_has_donation     = round(p_donation, 4),
        expected_value_php = round(max(expected_value, 0.0), 2),
        value_tier         = _value_to_tier(expected_value),
        feature_values     = X.iloc[0].to_dict(),
    )
