import io
import os

import pandas as pd
import psycopg2

# If the direct connection fails (IPv6-only on Windows), use the Session Pooler
# string from Supabase dashboard → Settings → Database → Session pooler tab.
# It looks like: postgresql://postgres.PROJECT:[PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres
CONN_STR = "postgresql://postgres.mfuxcubehnsiqlxokpqs:filipinogoodvietnambad@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

TABLE_ORDER = [
    "safehouses",
    "residents",
    "supporters",
    "partners",
    "partner_assignments",
    "donations",
    "in_kind_donation_items",
    "donation_allocations",
    "education_records",
    "health_wellbeing_records",
    "home_visitations",
    "incident_reports",
    "intervention_plans",
    "process_recordings",
    "safehouse_monthly_metrics",
    "social_media_posts",
    "public_impact_snapshots",
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def is_bool_col(series: pd.Series) -> bool:
    """True when every non-null value is the string 'True' or 'False'."""
    non_null = series.dropna()
    return not non_null.empty and non_null.isin(["True", "False"]).all()


def is_date_col(col_name: str) -> bool:
    col = col_name.lower()
    # Match columns ending with _at, or containing 'date', or specific known date cols
    return (
        col.endswith("_at")
        or "date" in col
        or col in ("month_start", "month_end", "published_at")
    )


def infer_pg_type(raw_series: pd.Series, col_name: str) -> str:
    """Infer PostgreSQL type from a raw (string-dtype) series."""
    if is_date_col(col_name):
        return "TIMESTAMPTZ"
    if is_bool_col(raw_series):
        return "BOOLEAN"
    non_null = raw_series.dropna()
    if non_null.empty:
        return "TEXT"
    # Try integer
    try:
        non_null.astype("Int64")
        return "BIGINT"
    except (ValueError, TypeError):
        pass
    # Try float
    try:
        non_null.astype(float)
        return "DOUBLE PRECISION"
    except (ValueError, TypeError):
        pass
    return "TEXT"


def build_create_sql(table: str, raw_df: pd.DataFrame) -> str:
    col_defs = [
        f'  "{col}" {infer_pg_type(raw_df[col], col)}'
        for col in raw_df.columns
    ]
    return (
        f'DROP TABLE IF EXISTS "{table}" CASCADE;\n'
        f'CREATE TABLE "{table}" (\n'
        + ",\n".join(col_defs)
        + "\n);"
    )


def transform_df(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Return a copy with types converted for COPY-friendly output."""
    df = raw_df.copy()
    for col in df.columns:
        if is_bool_col(raw_df[col]):
            df[col] = df[col].map({"True": "t", "False": "f"})
        elif is_date_col(col):
            df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


def df_to_csv_buffer(df: pd.DataFrame) -> io.StringIO:
    buf = io.StringIO()
    df.to_csv(buf, index=False, na_rep="")
    content = buf.getvalue().replace("NaT", "")
    return io.StringIO(content)


def import_table(conn, table: str):
    csv_path = os.path.join(SCRIPT_DIR, f"{table}.csv")
    if not os.path.exists(csv_path):
        print(f"  SKIP {table} — file not found")
        return

    # Read everything as strings; empty → NA
    raw_df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
    raw_df = raw_df.replace("", pd.NA)

    create_sql = build_create_sql(table, raw_df)
    df = transform_df(raw_df)

    with conn.cursor() as cur:
        cur.execute(create_sql)
        buf = df_to_csv_buffer(df)
        cur.copy_expert(
            f'COPY "{table}" FROM STDIN WITH (FORMAT CSV, HEADER TRUE, NULL \'\')',
            buf,
        )
    conn.commit()
    print(f"  OK  {table}: {len(df)} rows")


def main():
    print("Connecting to Supabase...")
    conn = psycopg2.connect(CONN_STR)
    conn.autocommit = False
    print("Connected.\n")

    for table in TABLE_ORDER:
        print(f"Importing {table}...")
        try:
            import_table(conn, table)
        except Exception as e:
            conn.rollback()
            print(f"  FAIL {table}: {e}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
