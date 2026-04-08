"""
Data loading utilities.

Notebooks call load_all_csvs() to load from the filesystem.
Operational jobs call load_from_supabase() to pull live data.
"""

import os
import pandas as pd
from pathlib import Path
from src.config import (
    DATA_RAW, DATASETS_DIR,
    RESIDENTS_FILE, HEALTH_FILE, EDUCATION_FILE,
    SESSIONS_FILE, VISITATIONS_FILE, PLANS_FILE, INCIDENTS_FILE,
)


def _find_csv(filename):
    """Resolve a CSV filename: check data/raw/ first, then repo datasets/."""
    candidates = [DATA_RAW / filename, DATASETS_DIR / filename]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        f"{filename} not found in data/raw/ or {DATASETS_DIR}. "
        "Place it in pipeline/resident_reintegration/data/raw/ and retry."
    )


def load_all_csvs():
    """
    Load all 7 source tables from CSV.
    Returns a dict keyed by logical table name.
    """
    parse_dates = {
        RESIDENTS_FILE:   ["date_of_birth", "date_of_admission", "date_closed", "date_enrolled",
                           "date_colb_registered", "date_colb_obtained", "date_case_study_prepared"],
        HEALTH_FILE:      ["record_date"],
        EDUCATION_FILE:   ["record_date"],
        SESSIONS_FILE:    ["session_date"],
        VISITATIONS_FILE: ["visit_date"],
        PLANS_FILE:       ["target_date", "case_conference_date", "created_at", "updated_at"],
        INCIDENTS_FILE:   ["incident_date", "resolution_date"],
    }

    tables = {}
    for filename in [RESIDENTS_FILE, HEALTH_FILE, EDUCATION_FILE, SESSIONS_FILE,
                     VISITATIONS_FILE, PLANS_FILE, INCIDENTS_FILE]:
        path = _find_csv(filename)
        tables[filename] = pd.read_csv(path, parse_dates=parse_dates.get(filename, []))

    return {
        "residents":   tables[RESIDENTS_FILE],
        "health":      tables[HEALTH_FILE],
        "education":   tables[EDUCATION_FILE],
        "sessions":    tables[SESSIONS_FILE],
        "visitations": tables[VISITATIONS_FILE],
        "plans":       tables[PLANS_FILE],
        "incidents":   tables[INCIDENTS_FILE],
    }


def load_from_supabase():
    """
    Load residents and related tables from Supabase.
    Requires SUPABASE_URL and SUPABASE_KEY environment variables.
    Returns same dict structure as load_all_csvs().
    """
    try:
        from supabase import create_client
    except ImportError:
        raise ImportError("Install supabase-py: pip install supabase")

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    sb  = create_client(url, key)

    def fetch(table_name):
        response = sb.table(table_name).select("*").execute()
        return pd.DataFrame(response.data)

    residents   = fetch("residents")
    health      = fetch("health_wellbeing_records")
    education   = fetch("education_records")
    sessions    = fetch("process_recordings")
    visitations = fetch("home_visitations")
    plans       = fetch("intervention_plans")
    incidents   = fetch("incident_reports")

    # Parse dates
    for col in ["date_of_birth", "date_of_admission", "date_closed", "date_enrolled"]:
        if col in residents.columns:
            residents[col] = pd.to_datetime(residents[col], errors="coerce")

    for df, col in [(health, "record_date"), (education, "record_date"),
                    (sessions, "session_date"), (visitations, "visit_date"),
                    (incidents, "incident_date")]:
        df[col] = pd.to_datetime(df[col], errors="coerce")

    return {
        "residents":   residents,
        "health":      health,
        "education":   education,
        "sessions":    sessions,
        "visitations": visitations,
        "plans":       plans,
        "incidents":   incidents,
    }
