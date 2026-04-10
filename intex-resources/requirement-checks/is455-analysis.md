# IS 455 – Machine Learning: Requirements Analysis
*Generated: 2026-04-09 | Project: Pag-asa Sanctuary (intex-w26)*

---

## Overview

IS 455 requires complete, end-to-end ML pipelines (20 pts total). Graders evaluate each pipeline on seven stages: Problem Framing, Data Acquisition/Preparation/Exploration, Modeling & Feature Selection, Evaluation & Selection, and Deployment & Integration. Quality over quantity — a poorly executed pipeline hurts, not helps. Each pipeline must address a genuinely different business problem. Pipelines must be deployed into the web application; a model that only exists in a notebook is not a complete pipeline.

The team has four pipelines in `pipeline/`:
1. `inactive_donor_pred` — Inactive Donor Prediction
2. `resident_reintegration` — Resident Reintegration Readiness
3. `safehouse_outcome_drivers` — Safehouse Outcome Drivers
4. `social_media_analytics` — Social Media Analytics

---

## Pipeline 1: Inactive Donor Prediction ✅ Most Complete

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
| Feature Selection | ✅ | `src/features.py` |
| Deployment | ✅ **Fully deployed** | `jobs/run_inference.py` scores all active donors and writes to `donor_risk_scores` in Supabase. API endpoint `GET /api/admin/ml/donor-risk-scores` reads from DB. MLPage (Admin) shows live data. |

**Additional outputs also deployed:**
- `DonorOutreachProfiles` — per-donor message templates, preferred channel, cadence, best day (`GET /api/admin/ml/donor-outreach-profiles`)
- `DonorUpgradeScores` — RFM segments and upgrade candidates with suggested ask amounts (`GET /api/admin/ml/donor-upgrade-scores`)

**Trained model artifact:** `artifacts/models/donor_risk_model.joblib` ✅

**Assessment:** This is the strongest pipeline. It is the only one fully deployed end-to-end: trained model → inference job → database → API endpoint → live dashboard UI. Make sure the video demonstrates the live data in the MLPage risk scoring section, the "Mark Contacted" action, outreach profile recommendations, and upgrade candidates.

---

## Pipeline 2: Resident Reintegration Readiness ⚠️ Pipeline Complete, Deployment Incomplete

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
| Deployment | ⚠️ **Partial** | `reintegration_model.joblib` exists and README says it writes to `resident_reintegration_scores` in Supabase. However, the MLPage `Resident Reintegration` section uses **hardcoded mock data** — 6 fake residents with hardcoded scores and labels. No API endpoint in `MLController` serves this data. |

**Trained model artifact:** `artifacts/models/reintegration_model.joblib` ✅
**Master pipeline notebook:** `notebooks/master_crispdm_pipeline.ipynb` ✅

**Assessment:** The notebook work appears complete and the model is trained. The critical gap is **deployment**: the web application shows mock data, not predictions from the actual model. To receive credit for the Deployment stage, you need to either:
1. Add a `GET /api/admin/ml/reintegration-scores` endpoint that reads from the `resident_reintegration_scores` DB table (if the inference job has already been run and data exists), OR
2. Add an endpoint that directly runs inference from the saved model

---

## Pipeline 3: Safehouse Outcome Drivers ❌ Incomplete

**Location:** `pipeline/safehouse_outcome_drivers/`

**Business Problem:** Explanatory panel regression — which operational inputs (counseling intensity, home visit frequency, staff caseload, etc.) drive variance in resident health scores and education progress across safehouses? Uses fixed-effects OLS to control for unobserved safehouse-level confounders.

**Pipeline Completeness:**

| Stage | Status | Notes |
|---|---|---|
| Problem Framing | ✅ | Well-framed; two research questions (health score + education progress as DVs); correctly identified as explanatory (not predictive); fixed-effects panel rationale clearly stated |
| Data Acquisition & Preparation | ✅ | Notebook 02 |
| Exploration | ✅ | Notebooks 02–03 |
| Modeling & Feature Selection | ⚠️ | Notebook 04 present but **no trained model artifact** saved (no `artifacts/models/` folder exists) |
| Evaluation & Selection | ✅ | Notebook 05 present |
| Deployment | ❌ **Not deployed** | Not shown in the web application at all. `SafehouseOutcomeCoefficientDto` and `SafehouseOutcomeDriverDto` exist in the backend DTOs folder, suggesting deployment work was started but not completed. No controller endpoint, no MLPage section. |

**Trained model artifact:** ❌ Missing (`artifacts/` folder only contains `runs/`)
**Master pipeline notebook:** ❌ Missing (no `master_crispdm_pipeline.ipynb`)

**Assessment:** This pipeline is the weakest. The business framing is sophisticated (fixed-effects panel regression is genuinely appropriate here), but without a saved model artifact and no deployment in the web app, it will receive very limited credit on the Deployment stage of the rubric — and the absence of a master pipeline notebook is also a gap. Given the time constraint (deadline tomorrow), focus effort on deploying the existing complete pipelines (Reintegration and Social Media) before investing more in this one.

---

## Pipeline 4: Social Media Analytics ⚠️ Pipeline Complete, Deployment Incomplete

**Location:** `pipeline/social_media_analytics/`

**Business Problem:** Two-stage predictive model — Stage 1: classify whether a post generates any donation (binary); Stage 2: predict donation value in PHP (regression). Uses post characteristics (platform, post type, media format, timing, topic, CTA) to guide smarter post planning before publication.

**Pipeline Completeness:**

| Stage | Status | Notes |
|---|---|---|
| Problem Framing | ✅ | Well-framed; two-stage rationale clearly justified (zero-inflated target); distinction between pre- and post-publication predictors noted |
| Data Acquisition & Preparation | ✅ | 812-post dataset; notebook 02–03 |
| Exploration | ✅ | Notebook 02 |
| Modeling & Feature Selection | ✅ | Two models trained: `explanatory_model.joblib` (what drives donations?) and `recommendation_model.joblib` (given post inputs, predict donation yield) |
| Evaluation & Selection | ✅ | Notebook 05 |
| Deployment | ⚠️ **Mock only** | MLPage shows a "Social ROI Predictor" UI where users select platform and post type and see estimated engagement/donation yield. However, the predictions are **hardcoded mock values** in the frontend (a lookup table by platform/post-type). The actual `recommendation_model.joblib` is not being called. |

**Trained model artifacts:** `artifacts/models/explanatory_model.joblib`, `artifacts/models/recommendation_model.joblib` ✅
**Master pipeline notebook:** `artifacts/master_crispdm_pipeline.ipynb` ✅ (note: located in `artifacts/` not `notebooks/`)

**Assessment:** Strong pipeline work. Like Reintegration, the gap is exclusively deployment: the trained model exists but the web app shows fake predictions. To fix this, you'd need a `POST /api/admin/ml/social-roi-predict` endpoint that accepts post characteristics as input, loads the `recommendation_model.joblib`, and returns a real prediction. This would replace the mock lookup table in the MLPage.

---

## Summary Assessment

| Pipeline | Notebooks | Trained Model | Deployed in App | Overall |
|---|---|---|---|---|
| Inactive Donor Prediction | ✅ Complete | ✅ Present | ✅ Live, real data | **Full credit likely** |
| Resident Reintegration | ✅ Complete | ✅ Present | ⚠️ Mock data only | **Strong notebooks, partial deployment** |
| Social Media Analytics | ✅ Complete | ✅ Present | ⚠️ Mock data only | **Strong notebooks, partial deployment** |
| Safehouse Outcome Drivers | ⚠️ No master notebook | ❌ Missing | ❌ Not in app | **Partial credit at best** |

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

## 🚨 Team Decisions Needed Before Friday

**Decision 1 — Reintegration + Social Media mock data:**
The MLPage shows hardcoded mock predictions for both Resident Reintegration and Social ROI. This is a known gap. The team needs to decide before Friday whether to connect these to the real trained models. Connecting either/both would meaningfully improve the Deployment score on those pipelines. See Priority Recommendations below for effort estimates.

**Decision 2 — Safehouse Outcome Drivers pipeline:**
This pipeline has notebooks but no saved model artifact and is not in the web application. The team needs to confirm: Is someone still working on this? If not, is the plan to submit it as-is with partial credit, or drop it from the submission video? Submitting a genuinely incomplete pipeline that the graders can see clearly isn't working is worse than focusing the video time on the three stronger pipelines.

**Decision 3 — Notebook submission location:**
The case says notebooks should be in `ml-pipelines/` at the repo root, named descriptively (e.g., `donor-churn-classifier.ipynb`). Your notebooks are currently inside `pipeline/[name]/notebooks/`. Before submission, confirm whether to:
- Symlink or copy the `master_crispdm_pipeline.ipynb` files to a top-level `ml-pipelines/` folder with descriptive names, OR
- Link graders directly to the correct paths in `pipeline/` (less clean, but acceptable if the submission form allows free-text URLs)

---

## Priority Recommendations (by Friday deadline)

**High priority — quick wins:**

1. **Reintegration model deployment:** If the inference job has been run and `resident_reintegration_scores` has data in Supabase, adding a simple `GET /api/admin/ml/reintegration-scores` endpoint and connecting it to the MLPage should take 1–2 hours. This converts a "mock" deployment into a real one.

2. **Social media model deployment:** Requires a `POST /api/staff/ml/social-roi-predict` endpoint that accepts post characteristics and returns predictions from `recommendation_model.joblib`. Slightly more complex (model needs to be loaded at runtime), but would make the interactive tool real rather than a lookup table.

3. **Notebook submission structure:** Confirm that `master_crispdm_pipeline.ipynb` files contain all required sections (especially Causal Analysis and Deployment Notes sections 5 and 6) since those will be closely scrutinized.

**Lower priority:**

4. **Safehouse Outcome Drivers:** Unless the model can be trained and deployed quickly, the time may be better spent polishing the three more complete pipelines. The business framing is excellent — if you can at least produce a trained model and serve the coefficient estimates through an API endpoint, it could still earn partial credit.
