"""
Feature engineering for the resident reintegration readiness model.

All aggregation logic lives here so notebooks and jobs share identical transformations.
"""

import re
import numpy as np
import pandas as pd
from src.config import RISK_LEVELS, POSITIVE_EMOTIONS, COOPERATION_MAP, LABEL_MAP, TARGET


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def build_feature_matrix(
    residents,
    health_df,
    edu_df,
    sessions_df,
    visits_df,
    plans_df,
    incidents_df,
):
    """
    Join all tables and return a per-resident feature DataFrame.

    Columns prefixed with their source table for clarity:
      - Resident-level profile features (no prefix)
      - hlth_*   from health_wellbeing_records
      - edu_*    from education_records
      - sess_*   from process_recordings
      - vis_*    from home_visitations
      - plan_*   from intervention_plans
      - inc_*    from incident_reports

    Returns a DataFrame indexed by resident_id. Does NOT include the target column.
    """
    df = residents.copy()

    # Build each feature block independently then merge
    df = _add_resident_features(df)
    df = df.merge(_aggregate_health(health_df),    on="resident_id", how="left")
    df = df.merge(_aggregate_education(edu_df),    on="resident_id", how="left")
    df = df.merge(_aggregate_sessions(sessions_df), on="resident_id", how="left")
    df = df.merge(_aggregate_visits(visits_df),    on="resident_id", how="left")
    df = df.merge(_aggregate_plans(plans_df),      on="resident_id", how="left")
    df = df.merge(_aggregate_incidents(incidents_df), on="resident_id", how="left")

    return df


def add_label(df):
    """
    Add binary target column `reintegration_ready`.

    Completed → 1 (Ready)
    Not Started / On Hold → 0 (Not Ready)
    In Progress → NaN (excluded from training; scored at inference)
    """
    df = df.copy()
    df[TARGET] = df["reintegration_status"].map(LABEL_MAP)
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Resident-level features
# ─────────────────────────────────────────────────────────────────────────────

def _parse_length_of_stay(los_str):
    """Convert '2 Years 4 months' → integer days. Returns NaN if unparseable."""
    if pd.isna(los_str):
        return np.nan
    years  = int(re.search(r"(\d+)\s+Year",  los_str).group(1)) if "Year"  in los_str else 0
    months = int(re.search(r"(\d+)\s+month", los_str).group(1)) if "month" in los_str else 0
    return years * 365 + months * 30


def _add_resident_features(df):
    df = df.copy()

    # Risk improvement: did risk level go down from intake to current?
    df["initial_risk_numeric"]  = df["initial_risk_level"].map(RISK_LEVELS).fillna(1)
    df["current_risk_numeric"]  = df["current_risk_level"].map(RISK_LEVELS).fillna(1)
    df["risk_improvement"]      = (df["current_risk_numeric"] < df["initial_risk_numeric"]).astype(int)
    df["risk_delta"]            = df["initial_risk_numeric"] - df["current_risk_numeric"]  # positive = improved

    # Length of stay in days (from pre-computed string column)
    df["length_of_stay_days"] = df["length_of_stay"].apply(_parse_length_of_stay)

    # Boolean sub-category flags → integers
    sub_cat_cols = [c for c in df.columns if c.startswith("sub_cat_")]
    for col in sub_cat_cols:
        df[col] = df[col].astype(bool).astype(int)

    # Abuse severity composite: count of abuse-related sub-categories
    abuse_cols = ["sub_cat_physical_abuse", "sub_cat_sexual_abuse", "sub_cat_osaec",
                  "sub_cat_trafficked", "sub_cat_child_labor"]
    df["abuse_complexity_score"] = df[[c for c in abuse_cols if c in df.columns]].sum(axis=1)

    # Family stability composite: count of family vulnerability flags
    family_vuln_cols = ["family_is_4ps", "family_solo_parent", "family_indigenous",
                        "family_parent_pwd", "family_informal_settler"]
    for col in family_vuln_cols:
        df[col] = df[col].astype(bool).astype(int)
    df["family_vulnerability_score"] = df[[c for c in family_vuln_cols if c in df.columns]].sum(axis=1)

    # Complexity flags
    df["is_pwd"]          = df["is_pwd"].astype(bool).astype(int)
    df["has_special_needs"] = df["has_special_needs"].astype(bool).astype(int)

    # Age at admission (already numeric)
    df["age_upon_admission"] = pd.to_numeric(df["age_upon_admission"], errors="coerce")

    return df


# ─────────────────────────────────────────────────────────────────────────────
# Health & Wellbeing
# ─────────────────────────────────────────────────────────────────────────────

def _aggregate_health(health_df):
    df = health_df.copy()
    df["record_date"] = pd.to_datetime(df["record_date"])
    df = df.sort_values(["resident_id", "record_date"])

    score_cols = ["general_health_score", "nutrition_score", "sleep_quality_score", "energy_level_score"]

    agg = df.groupby("resident_id").agg(
        hlth_n_records        = ("health_record_id", "count"),
        hlth_avg_general      = ("general_health_score",   "mean"),
        hlth_avg_nutrition    = ("nutrition_score",        "mean"),
        hlth_avg_sleep        = ("sleep_quality_score",    "mean"),
        hlth_avg_energy       = ("energy_level_score",     "mean"),
        hlth_pct_medical      = ("medical_checkup_done",   "mean"),
        hlth_pct_dental       = ("dental_checkup_done",    "mean"),
        hlth_pct_psychological = ("psychological_checkup_done", "mean"),
    ).reset_index()

    # Health improvement trend (linear slope of general_health_score over time)
    def health_trend(grp):
        vals = grp["general_health_score"].dropna().values
        return _compute_trend(vals)

    trends = df.groupby("resident_id").apply(health_trend).reset_index()
    trends.columns = ["resident_id", "hlth_trend"]

    agg = agg.merge(trends, on="resident_id", how="left")
    return agg


# ─────────────────────────────────────────────────────────────────────────────
# Education
# ─────────────────────────────────────────────────────────────────────────────

_COMPLETION_STATUS_MAP = {"NotStarted": 0, "InProgress": 1, "Completed": 2}

def _aggregate_education(edu_df):
    df = edu_df.copy()
    df["record_date"] = pd.to_datetime(df["record_date"])
    df = df.sort_values(["resident_id", "record_date"])

    agg = df.groupby("resident_id").agg(
        edu_n_records         = ("education_record_id",  "count"),
        edu_avg_attendance    = ("attendance_rate",      "mean"),
        edu_avg_progress      = ("progress_percent",     "mean"),
    ).reset_index()

    # Latest completion status (most recent record)
    latest = (
        df.sort_values("record_date")
        .groupby("resident_id")
        .last()[["completion_status"]]
        .reset_index()
    )
    latest["edu_latest_completion"] = latest["completion_status"].map(_COMPLETION_STATUS_MAP).fillna(0)
    agg = agg.merge(latest[["resident_id", "edu_latest_completion"]], on="resident_id", how="left")

    # Education progress trend
    def edu_trend(grp):
        vals = grp["progress_percent"].dropna().values
        return _compute_trend(vals)

    trends = df.groupby("resident_id").apply(edu_trend).reset_index()
    trends.columns = ["resident_id", "edu_trend"]
    agg = agg.merge(trends, on="resident_id", how="left")

    return agg


# ─────────────────────────────────────────────────────────────────────────────
# Process Recordings (sessions)
# ─────────────────────────────────────────────────────────────────────────────

def _aggregate_sessions(sessions_df):
    df = sessions_df.copy()
    df["session_date"] = pd.to_datetime(df["session_date"])
    df = df.sort_values(["resident_id", "session_date"])

    # Encode emotional state end as positive/negative
    df["emotion_end_positive"] = df["emotional_state_end"].isin(POSITIVE_EMOTIONS).astype(int)

    agg = df.groupby("resident_id").agg(
        sess_n_sessions           = ("recording_id",       "count"),
        sess_pct_progress_noted   = ("progress_noted",     "mean"),
        sess_pct_concerns_flagged = ("concerns_flagged",   "mean"),
        sess_pct_referral_made    = ("referral_made",      "mean"),
        sess_avg_duration_min     = ("session_duration_minutes", "mean"),
        sess_pct_positive_end     = ("emotion_end_positive", "mean"),
    ).reset_index()

    # Emotional trend over time (linear slope)
    # Note: sess_recent_emotional_positive removed — captured by sess_pct_positive_end
    def emotion_trend(grp):
        vals = grp.sort_values("session_date")["emotion_end_positive"].values
        return _compute_trend(vals)

    trends = df.groupby("resident_id").apply(emotion_trend).reset_index()
    trends.columns = ["resident_id", "sess_emotional_trend"]
    agg = agg.merge(trends, on="resident_id", how="left")

    return agg


# ─────────────────────────────────────────────────────────────────────────────
# Home Visitations
# ─────────────────────────────────────────────────────────────────────────────

def _aggregate_visits(visits_df):
    df = visits_df.copy()
    df["visit_date"] = pd.to_datetime(df["visit_date"])
    df = df.sort_values(["resident_id", "visit_date"])

    # Encode cooperation level (ordinal)
    df["cooperation_score"] = df["family_cooperation_level"].map(COOPERATION_MAP)

    # Encode visit outcome as binary favorable
    df["visit_favorable"] = (df["visit_outcome"] == "Favorable").astype(int)

    agg = df.groupby("resident_id").agg(
        vis_n_visits                    = ("visitation_id",          "count"),
        vis_n_reintegration_assessments = ("visit_type",             lambda x: (x == "Reintegration Assessment").sum()),
        vis_pct_favorable               = ("visit_favorable",        "mean"),
        vis_avg_cooperation             = ("cooperation_score",      "mean"),
        vis_pct_safety_concerns         = ("safety_concerns_noted",  "mean"),
    ).reset_index()

    # Note: vis_recent_favorable and vis_recent_cooperation removed — captured by
    # vis_pct_favorable and vis_avg_cooperation respectively.

    return agg


# ─────────────────────────────────────────────────────────────────────────────
# Intervention Plans
# ─────────────────────────────────────────────────────────────────────────────

def _aggregate_plans(plans_df):
    df = plans_df.copy()

    agg = df.groupby("resident_id").agg(
        plan_n_plans      = ("plan_id",  "count"),
        plan_n_achieved   = ("status",   lambda x: (x == "Achieved").sum()),
        plan_n_on_hold    = ("status",   lambda x: (x == "On Hold").sum()),
    ).reset_index()

    agg["plan_achieved_ratio"] = agg["plan_n_achieved"] / agg["plan_n_plans"].clip(lower=1)
    agg["plan_blocked_ratio"]  = agg["plan_n_on_hold"]  / agg["plan_n_plans"].clip(lower=1)

    return agg


# ─────────────────────────────────────────────────────────────────────────────
# Incident Reports
# ─────────────────────────────────────────────────────────────────────────────

def _aggregate_incidents(incidents_df):
    """
    Returns a row per resident.
    Residents with zero incidents get 0 for all count features.
    """
    df = incidents_df.copy()

    agg = df.groupby("resident_id").agg(
        inc_total_incidents        = ("incident_id",    "count"),
        inc_high_severity_count    = ("severity",       lambda x: (x == "High").sum()),
        inc_pct_unresolved         = ("resolved",       lambda x: (~x.astype(bool)).mean()),
        inc_critical_count         = ("incident_type",  lambda x: ((x == "SelfHarm") | (x == "RunawayAttempt")).sum()),
    ).reset_index()

    # inc_selfharm_count and inc_runaway_count removed — combined into inc_critical_count

    return agg


# ─────────────────────────────────────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────────────────────────────────────

def _compute_trend(values):
    """
    Compute linear slope of a value sequence.
    Returns 0.0 if fewer than 3 data points (not enough for a reliable trend).
    """
    if len(values) < 3:
        return 0.0
    x = np.arange(len(values), dtype=float)
    slope = np.polyfit(x, values, 1)[0]
    return float(slope)
