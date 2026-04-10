-- Safehouse Outcome Drivers — Supabase table DDL
-- Run once in the Supabase SQL editor before the first job execution.

-- Coefficient table: one row per feature per weekly run
CREATE TABLE IF NOT EXISTS public.safehouse_outcome_coefficients (
    id          bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_date    date    NOT NULL,
    feature     text    NOT NULL,
    beta_health numeric,
    se_health   numeric,
    p_health    numeric,
    sig_health  text,
    beta_edu    numeric,
    se_edu      numeric,
    p_edu       numeric,
    sig_edu     text
);

-- Drivers table: one row per safehouse per weekly run (full replace each time)
CREATE TABLE IF NOT EXISTS public.safehouse_outcome_drivers (
    id             bigint  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_date       date    NOT NULL,
    safehouse_id   integer NOT NULL,
    region         text,
    var_health     numeric,
    var_edu        numeric,
    flagged_health boolean,
    flagged_edu    boolean,
    flagged_for    text,
    note           text
);
