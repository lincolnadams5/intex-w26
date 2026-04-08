"""Feature engineering — shared by training and inference pipelines."""
from __future__ import annotations

import numpy as np
import pandas as pd

from src.config import (
    DONATION_THRESHOLD,
    EXCLUDE_COLS,
    POST_PUB_FEATURES,
    PRE_PUB_FEATURES,
    TARGET_BINARY,
    TARGET_LOG,
    TARGET_VALUE,
)

# Peak hours derived from EDA (Phase 3): morning window 9am–12pm and evening 6–7pm
# peak days derived from EDA (Phase 3): Mon/Tue/Fri — Thursday is the worst-performing day
_PEAK_HOURS = {9, 10, 11, 18, 19}
_PEAK_DAYS  = {"Monday", "Tuesday"}

# Media types that indicate video content
_VIDEO_MEDIA_TYPES = {"Video", "Reel", "Story"}

# Post / content topics associated with impact or fundraising
_IMPACT_TOPICS = {"Impact", "Fundraising", "FundraisingAppeal", "Donation"}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered columns in-place (returns a copy)."""
    df = df.copy()

    # Boolean columns from CSV may arrive as object dtype
    for col in ("has_call_to_action", "is_boosted", "features_resident_story"):
        if col in df.columns and df[col].dtype == object:
            df[col] = df[col].map({"True": 1, "False": 0, True: 1, False: 0}).fillna(0).astype(int)
        elif col in df.columns:
            df[col] = df[col].fillna(0).astype(int)

    # is_peak_hour: 1 if post_hour is in peak set
    if "post_hour" in df.columns:
        df["is_peak_hour"] = df["post_hour"].isin(_PEAK_HOURS).astype(int)
    else:
        df["is_peak_hour"] = 0

    # is_peak_day: 1 if day_of_week is in peak set
    if "day_of_week" in df.columns:
        df["is_peak_day"] = df["day_of_week"].isin(_PEAK_DAYS).astype(int)
    else:
        df["is_peak_day"] = 0

    # has_video_content: 1 if media_type or post_type indicates video
    media_video = (
        df["media_type"].isin(_VIDEO_MEDIA_TYPES) if "media_type" in df.columns
        else pd.Series(False, index=df.index)
    )
    post_video = (
        df["post_type"].str.contains("Reel|Video|Story", case=False, na=False)
        if "post_type" in df.columns
        else pd.Series(False, index=df.index)
    )
    df["has_video_content"] = (media_video | post_video).astype(int)

    # is_impact_or_fundraising: 1 if content_topic or post_type relates to impact/fundraising
    topic_flag = (
        df["content_topic"].isin(_IMPACT_TOPICS) if "content_topic" in df.columns
        else pd.Series(False, index=df.index)
    )
    post_flag = (
        df["post_type"].isin(_IMPACT_TOPICS) if "post_type" in df.columns
        else pd.Series(False, index=df.index)
    )
    df["is_impact_or_fundraising"] = (topic_flag | post_flag).astype(int)

    # engagement_per_follower: engagement_rate normalised by follower count (post-pub)
    if "engagement_rate" in df.columns and "follower_count_at_post" in df.columns:
        denom = df["follower_count_at_post"].replace(0, np.nan)
        df["engagement_per_follower"] = df["engagement_rate"] / denom

    return df


def build_targets(df: pd.DataFrame) -> pd.DataFrame:
    """Add has_donation (binary) and log_donation_value (log1p) columns."""
    df = df.copy()
    df[TARGET_BINARY] = (df[TARGET_VALUE] > DONATION_THRESHOLD).astype(int)
    df[TARGET_LOG]    = np.log1p(df[TARGET_VALUE].clip(lower=0))
    return df


def get_feature_sets(df: pd.DataFrame) -> tuple[list[str], list[str]]:
    """
    Return (pre_pub_cols, post_pub_cols) — only columns actually present in df.
    Engineered columns that match PRE_PUB_FEATURES are included automatically.
    """
    available = set(df.columns)
    pre_pub  = [c for c in PRE_PUB_FEATURES  if c in available]
    post_pub = [c for c in POST_PUB_FEATURES if c in available]
    return pre_pub, post_pub
