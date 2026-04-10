# IS 455 – Machine Learning: Requirements Analysis
*Generated: 2026-04-09 | Updated: 2026-04-10 | Project: Pag-asa Sanctuary (intex-w26)*

---

## Overview

IS 455 requires complete, end-to-end ML pipelines (20 pts total). Graders evaluate each pipeline on seven stages: Problem Framing, Data Acquisition/Preparation/Exploration, Modeling & Feature Selection, Evaluation & Selection, and Deployment & Integration. Quality over quantity — a poorly executed pipeline hurts, not helps. Each pipeline must address a genuinely different business problem. Pipelines must be deployed into the web application; a model that only exists in a notebook is not a complete pipeline.

The team has four pipelines in `pipeline/`:
1. `inactive_donor_pred` — Inactive Donor Prediction
2. `resident_reintegration` — Resident Reintegration Readiness
3. `safehouse_outcome_drivers` — Safehouse Outcome Drivers
4. `social_media_analytics` — Social Media Analytics

---

## Pipeline 1: Inactive Donor Prediction ✅ Fully Deployed

**Location:** `pipeline/inactive_donor_pred/`

**Business Problem:** Binary classification — identify donors who have not donated in the last 90 days and are at risk of permanent lapse, so the team can prioritize outreach.

**Pipeline Completeness:**

| Stage | Status | Notes |
|---|---|---|
| Problem Framing | ✅ | Business question clearly stated; binary classification with label definition (`at_risk = 1` if no donation in 90 days); target variable and inference scope defined |
| Data Acquisition & Preparation | ✅ | Notebooks 01–03 present; reproducible pipeline; `src/` module with `data_io.py`, `features.py`, `config.py` |
| Exploration | ✅ | Notebook 02 (`data_understanding.ipynb`) |
| Modeling & Feature Selection | ✅ | Notebook 04; `src/modeling.py` |
| Evaluation & Selection | ✅ | Notebook 05; `src/evaluation.py`, `src/metrics.py` |
| Deployment | ✅ **Fully deployed** | `jobs/run_inference.py` scores all active donors and writes to `donor_risk_scores` in Supabase. GitHub Actions weekly workflow (`ml-inference.yml`) runs automatically every Sunday. API endpoints in `MLController.cs` serve live data. MLPage (Admin) shows real scores with "Mark Contacted" action. |

**Additional outputs also deployed:**
- `DonorOutreachProfiles` — per-donor message templates, preferred channel, cadence, best day (`GET /api/admin/ml/donor-outreach-profiles`)
- `DonorUpgradeScores` — RFM segments and upgrade candidates with suggested ask amounts (`GET /api/admin/ml/donor-upgrade-scores`)

**Trained model artifact:** `artifacts/models/donor_risk_model.joblib` ✅
**GitHub Actions workflow:** `ml-inference.yml` — runs weekly (every Sunday at midnight UTC) ✅

**Assessment:** This is the strongest pipeline. It is the only one fully deployed end-to-end: trained model → inference job → database → API endpoint → live dashboard UI. Make sure the video demonstrates the live data in the MLPage risk scoring section, the "Mark Contacted" action, outreach profile recommendations, and upgrade candidates.

---

## Pipeline 2: Resident Reintegration Readiness ⚠️ Infrastructure Ready, UI Not Connected

**Location:** `pipeline/resident_reintegration/`

**Business Problem:** Binary classification — which "In Progress" residents are on track for successful reintegration vs. at risk of stalling? Enables social workers and board members to prioritize interventions before a case regresses.

**Pipeline Completeness:**

| Stage | Status | Notes |
|---|---|---|
| Problem Framing | ✅ | Clearly stated; target = `reintegration_ready` engineered from `reintegration_status`; positive class = Completed; In Progress residents treated as unknowns to avoid label leakage |
| Data Acquisition & Preparation | ✅ | Seven tables joined (`residents`, `health_wellbeing_records`, `education_records`, `process_recordings`, `home_visitations`, `intervention_plans`, `incident_reports`) |
| Exploration | ✅ | Notebook 02 |
| Modeling & Feature Selection | ✅ | Notebook 04; `src/modeling.py` |
| Evaluation & Selection | ✅ | Notebook 05; `src/evaluation.py` |
| Deployment | ⚠️ **Infrastructure ready; UI not connected** | `score_residents.py` inference job exists (supports `--source supabase --sink supabase`); GitHub Actions nightly workflow (`resident-reintegration-scoring.yml`) is set up. Backend `AdminController.cs` includes a try/catch that attempts to read from `resident_reintegration_scores` (with fallback if table is not yet populated). However, **MLPage still renders hardcoded mock data** — 6 fake residents. The frontend has not been wired to the real data. |

**Trained model artifact:** `artifacts/models/reintegration_model.joblib` ✅
**Master pipeline notebook:** `notebooks/master_crispdm_pipeline.ipynb` ✅
**GitHub Actions workflow:** `resident-reintegration-scoring.yml` — runs nightly (2am UTC) ✅

**Assessment:** The pipeline is complete and the deployment infrastructure is substantially in place — inference job, nightly workflow, and backend catch logic all exist. The remaining gap is the frontend: `MLPage.tsx` still renders `MOCK_REINTEGRATION` data. Connecting the UI would require checking whether `resident_reintegration_scores` has data in Supabase (from a prior inference run), then updating the MLPage to call the relevant API.

---

## Pipeline 3: Safehouse Outcome Drivers ⚠️ Infrastructure Exists, No Trained Model

**Location:** `pipeline/safehouse_outcome_drivers/`

**Business Problem:** Explanatory panel regression — which operational inputs (counseling intensity, home visit frequency, staff caseload, etc.) drive variance in resident health scores and education progress across safehouses? Uses fixed-effects OLS to control for unobserved safehouse-level confounders.

**Pipeline Completeness:**

| Stage | Status | Notes |
|---|---|---|
| Problem Framing | ✅ | Well-framed; two research questions (health score + education progress as DVs); correctly identified as explanatory (not predictive); fixed-effects panel rationale clearly stated |
| Data Acquisition & Preparation | ✅ | Notebook 02 |
| Exploration | ✅ | Notebooks 02–03 |
| Modeling & Feature Selection | ⚠️ | Notebook 04 present but **no trained model artifact** saved (only `artifacts/runs/` directory, no `artifacts/models/` file) |
| Evaluation & Selection | ✅ | Notebook 05 present |
| Deployment | ⚠️ **Partial** | `jobs/run_regression.py` inference job exists. GitHub Actions weekly workflow (`safehouse-regression.yml`) is set up. Backend has `GET /api/admin/safehouses/outcome-coefficients` and `GET /api/admin/safehouses/outcome-drivers` endpoints using raw SQL against Supabase-managed tables. Frontend does not have a dedicated UI section for this pipeline. |

**Trained model artifact:** ❌ Missing (`artifacts/` contains only `runs/` subdirectory)
**Master pipeline notebook:** ❌ Missing (no `master_crispdm_pipeline.ipynb`)
**GitHub Actions workflow:** `safehouse-regression.yml` — runs weekly (Sunday at midnight UTC) ✅

**Assessment:** Significant progress since the initial assessment — inference job, GitHub Actions workflow, and backend API endpoints now all exist. The two remaining gaps are: (1) no saved model artifact from training, and (2) no frontend UI section in MLPage showing the outcome coefficients or driver flags. The backend endpoints querying the `safehouse_outcome_coefficients` and `safehouse_outcome_drivers` Supabase tables are ready to use once the regression job has been run and data is present. The missing master notebook is also a gap for grading.

---

## Pipeline 4: Social Media Analytics ⚠️ Backend Ready, UI Still Mock

**Location:** `pipeline/social_media_analytics/`

**Business Problem:** Two-stage predictive model — Stage 1: classify whether a post generates any donation (binary); Stage 2: predict donation value in PHP (regression). Uses post characteristics (platform, post type, media format, timing, topic, CTA) to guide smarter post planning before publication.

**Pipeline Completeness:**

| Stage | Status | Notes |
|---|---|---|
| Problem Framing | ✅ | Well-framed; two-stage rationale clearly justified (zero-inflated target); distinction between pre- and post-publication predictors noted |
| Data Acquisition & Preparation | ✅ | 812-post dataset; notebooks 02–03 |
| Exploration | ✅ | Notebook 02 |
| Modeling & Feature Selection | ✅ | Two models trained: `explanatory_model.joblib` and `recommendation_model.joblib` |
| Evaluation & Selection | ✅ | Notebook 05 |
| Deployment | ⚠️ **Backend API ready; UI still mock; FastAPI server not deployed** | Three backend endpoints exist in `AdminController.cs`: `GET /api/admin/social/ml-summary`, `GET /api/admin/social/ml-top-posts` (query Supabase for pre-scored posts), and `POST /api/admin/social/score-post` (proxies to a FastAPI server at `localhost:8001/score`). Typed API wrappers (`getSocialMlSummary`, `getSocialMlTopPosts`, `scorePost`) exist in `adminApi.ts`. However, **MLPage still shows hardcoded `MOCK_ROI`** lookup values — none of the real API functions are called from the ML page. The FastAPI inference server is also not deployed (proxies to localhost:8001 which won't exist in production). |

**Trained model artifacts:** `artifacts/models/explanatory_model.joblib`, `artifacts/models/recommendation_model.joblib` ✅
**Master pipeline notebook:** `artifacts/master_crispdm_pipeline.ipynb` ✅ (note: located in `artifacts/` not `notebooks/`)
**GitHub Actions workflow:** ❌ Not set up for social media inference

**Assessment:** Backend API infrastructure is further along than previously assessed — endpoints exist and typed wrappers are in adminApi.ts. The gap is (1) the MLPage frontend still renders mock data instead of calling these real endpoints, and (2) the `score-post` endpoint proxies to a localhost FastAPI server that isn't deployed. The `ml-summary` and `ml-top-posts` endpoints reading from Supabase could be connected to the UI with relatively low effort if post scoring has been run previously.

---

## Summary Assessment

| Pipeline | Notebooks | Trained Model | Inference Job | GitHub Action | Deployed in App UI | Overall |
|---|---|---|---|---|---|---|
| Inactive Donor Prediction | ✅ Complete | ✅ Present | ✅ `run_inference.py` | ✅ Weekly | ✅ Live, real data | **Full credit likely** |
| Resident Reintegration | ✅ Complete | ✅ Present | ✅ `score_residents.py` | ✅ Nightly | ⚠️ Mock data in UI | **Strong notebooks + infra; UI gap** |
| Social Media Analytics | ✅ Complete | ✅ Present | ❌ No inference job | ❌ None | ⚠️ Mock data in UI | **Strong notebooks; backend partially ready** |
| Safehouse Outcome Drivers | ⚠️ No master notebook | ❌ Missing | ✅ `run_regression.py` | ✅ Weekly | ❌ Not in UI | **Infra exists; no artifact or UI** |

---

## What to Submit

The case requires submitting a Jupyter notebook (`.ipynb`) in `ml-pipelines/` at the root of the GitHub repo, named descriptively (e.g., `donor-churn-classifier.ipynb`). **Check whether the notebooks are in the correct location and with the correct naming convention.** Currently the notebooks are organized within each pipeline's `notebooks/` subdirectory — confirm the submission form expectation matches your structure, or whether you need to surface the `master_crispdm_pipeline.ipynb` from each pipeline at the top level.

**Each submitted notebook must include these six sections:**
1. Problem Framing (written explanation, not just code)
2. Data Acquisition, Preparation & Exploration
3. Modeling & Feature Selection
4. Evaluation & Interpretation (in business terms, not just R²/accuracy)
5. Causal and Relationship Analysis (correlation vs. causation discussion)
6. Deployment Notes (how the model is deployed and where the integration code lives)

---

## 🚨 Team Decisions Needed Before Submission

**Decision 1 — Notebook submission location:**
The case says notebooks should be in `ml-pipelines/` at the repo root, named descriptively. Your notebooks are currently inside `pipeline/[name]/notebooks/`. Before submission, confirm whether to copy the `master_crispdm_pipeline.ipynb` files to a top-level `ml-pipelines/` folder with descriptive names, or link graders directly to the subdirectory paths.

**Decision 2 — Reintegration UI:**
The inference job and nightly workflow are ready. If `resident_reintegration_scores` has data in Supabase from a prior run, wiring the MLPage to the real data is low effort. Decide whether to connect it before submission.

**Decision 3 — Safehouse Outcome Drivers master notebook:**
No `master_crispdm_pipeline.ipynb` exists for this pipeline. Without it, graders have no single-document view of the full CRISP-DM process. If time allows, create it before submission.

**Decision 4 — Social media FastAPI server:**
The `score-post` backend endpoint proxies to `localhost:8001` — this won't work in production on Render. Either deploy the FastAPI server separately and update the URL, or the interactive scoring feature will 503 in production.

---

## Priority Recommendations

**High priority:**

1. **Confirm notebook submission structure** — this is the single highest-risk gap. If TAs can't find notebooks, you lose points regardless of quality.

2. **Reintegration UI connection** — if `resident_reintegration_scores` has Supabase data, update MLPage to call the backend endpoint instead of the mock array. Low effort, visible impact on the Deployment score.

3. **Safehouse master notebook** — add `master_crispdm_pipeline.ipynb` that walks through all six required CRISP-DM sections. The backend infrastructure is already there; the notebook is the gap for graders.

**Lower priority:**

4. **Social media MLPage wiring** — the `ml-summary` and `ml-top-posts` endpoints exist; replacing the mock lookup table with a call to these endpoints would improve the deployment score for this pipeline without requiring a deployed FastAPI server.

5. **Confirm sections 5 and 6 in all master notebooks** — Causal Analysis and Deployment Notes are the sections most likely to be thin or missing. Review each `master_crispdm_pipeline.ipynb` before submission.
