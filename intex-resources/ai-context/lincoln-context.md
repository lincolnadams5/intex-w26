# Project Context — INTEX W26 Group Project

> Paste this file at the start of any new AI chat session to provide full project context.

---

## What This Project Is

This is a multi-class capstone project (called "INTEX") for a BYU Information Systems program. The project involves building a full-stack web application for a **fictional nonprofit organization** modeled after Lighthouse Sanctuary — a real US-based 501(c)(3) that operates safe homes for girls who are survivors of sexual abuse or sex trafficking in the Philippines.

The new organization will operate similarly but in additional regions. Lighthouse Sanctuary has shared anonymized operational data to inform the system design. The student team's job is to build the technology infrastructure the new organization needs to operate.

---

## The Organization's Core Problems

1. **Donor retention and growth** — They lose donors and don't understand why. Fundraising campaigns run but ROI is unclear. They want to identify which donors might give more, which are at risk of lapsing, and how to personalize outreach without a dedicated marketing team. They also want to connect donation activity to resident outcomes.

2. **Resident case management** — Staff manage multiple safehouses with limited headcount. They need to track which girls are progressing or struggling, which interventions work, and when a resident is ready for reintegration or at risk of regression. This includes intake, counseling documentation (process recordings), home visitation tracking, case conferences, and intervention planning.

3. **Social media strategy** — Social media is their primary donor acquisition channel, but founders are not experienced with it. They post sporadically and need data-driven guidance: what to post, on which platforms, how often, at what time, and what content actually leads to donations vs. just engagement.

4. **Lean administration** — All systems must be manageable by limited, non-technical staff. Easy to create, update, and carefully remove data.

5. **Security and privacy** — Data involves minors who are abuse survivors. Privacy and data protection are paramount.

---

## Classes and Their Requirements

### IS 401 — Project Management & Systems Design
Scrum-based sprints across Monday–Friday. Deliverables include:
- Customer personas, journey maps, problem statements
- MoSCoW table and product backlog
- Sprint backlogs with point estimates and owner assignments
- Burndown chart updated throughout the week
- Figma wireframes (3 most important screens, desktop view)
- AI-generated UI options (3 designs × 3 screenshots each, with analysis)
- Tech stack diagram
- Screenshots of 5+ pages (desktop and mobile)
- One working deployed page with DB persistence
- User feedback session (5 specific changes documented)
- OKR metric tracked and displayed in the app
- Lighthouse accessibility score ≥ 90% on every page
- Retrospective (individual and team reflection)

### IS 413 — Enterprise Application Development
Full-stack web application using:
- **Frontend:** React + TypeScript (Vite)
- **Backend:** .NET 10 / C#
- **Database:** Azure SQL Database, MySQL, or PostgreSQL (team's choice)
- **Deployment:** Microsoft Azure (recommended)

**Public pages (unauthenticated):**
- Home / Landing Page
- Impact / Donor-Facing Dashboard (anonymized aggregate data)
- Login Page
- Privacy Policy + Cookie Consent (GDPR-compliant)

**Admin / Staff portal (authenticated only):**
- Admin Dashboard — command center with key metrics: active residents, recent donations, upcoming case conferences, summarized progress
- Donors & Contributions — supporter profiles, contribution tracking (all types), donation allocations
- Caseload Inventory — full resident case management: demographics, case categories, subcategories, disability info, family profile, admission details, referral info, assigned social workers, reintegration tracking; filterable/searchable
- Process Recording — counseling session notes per resident: date, social worker, session type, emotional state, narrative, interventions, follow-up; chronological history per resident
- Home Visitation & Case Conferences — visit logs (type, observations, family cooperation, safety concerns, follow-up); case conference history and upcoming conferences
- Reports & Analytics — donation trends, resident outcome metrics, safehouse comparisons, reintegration success rates; aligned with Philippine Annual Accomplishment Report format

**Code quality requirements:** validation, error handling, pagination, consistent UI, titles, icons, logos, speed, responsiveness.

### IS 414 — Security
- **HTTPS/TLS** on all public connections; redirect HTTP → HTTPS
- **Authentication** via ASP.NET Identity (username/password); better-than-default password policy
- **RBAC:** Admin can CUD data; donors can see their own history and donation impact; unauthenticated users see public pages only
- **Integrity:** Confirmation required before deleting data
- **Credentials:** Stored securely (secrets manager, .env file, or env variables); never in code or public repos
- **Privacy:** GDPR-compliant privacy policy linked from footer; GDPR cookie consent notification (functional)
- **CSP Header:** Content-Security-Policy HTTP header set with specific sources; not embedded in `<meta>` tag
- **Availability:** Publicly deployed
- **Additional security features (bonus):** Third-party auth, MFA/2FA, HSTS, browser-accessible cookie for user settings (e.g., dark mode), data sanitization/encoding, deploy both DBs to real DBMS (not SQLite), Docker deployment

**Grading note:** Features not demonstrated in the IS414 video will not receive points, no exceptions.

### IS 455 — Machine Learning
Deliver as many complete ML pipelines as possible, each addressing a different business problem. Each pipeline must follow the full end-to-end lifecycle:

1. **Problem Framing** — business question, success metrics, predictive vs. explanatory choice (justified)
2. **Data Acquisition & Preparation** — clean, transform, engineer features; reproducible pipeline (not one-off scripts); joins across tables documented
3. **Exploration** — distributions, correlations, anomalies documented before modeling
4. **Modeling** — appropriate algorithm(s); multiple approaches compared where applicable; hyperparameter tuning
5. **Evaluation & Selection** — proper train/test split or cross-validation; results interpreted in business terms; false positive/negative consequences discussed
6. **Feature Selection** — justified; not "throw everything in"
7. **Deployment** — model integrated into the web app (API endpoint, dashboard component, or interactive tool)

Each pipeline must include both a causal/explanatory analysis and a predictive model. Pipelines are submitted as `.ipynb` files in `ml-pipelines/` in the GitHub repo, named descriptively (e.g., `donor-churn-classifier.ipynb`).

**Suggested pipeline opportunities:**
- Donor churn / lapse risk prediction
- Donor upgrade likelihood (identifying donors likely to give more)
- Resident reintegration readiness prediction
- Resident regression / risk escalation prediction
- Social media post ROI prediction (which post attributes drive donations)
- Intervention effectiveness analysis (explanatory)
- Campaign performance prediction

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | .NET 10 / C# |
| Database | Azure SQL / MySQL / PostgreSQL |
| Deployment | Microsoft Azure |
| Auth | ASP.NET Identity |
| ML | Jupyter notebooks (.ipynb), deployed via API endpoints |

---

## Dataset Overview

17 CSV tables organized into three domains:

### Donor and Support Domain
| Table | Description |
|---|---|
| `safehouses` | Physical safehouse locations |
| `partners` | Contracted service-delivery organizations and individuals |
| `partner_assignments` | Which partners serve which safehouses and in what capacity |
| `supporters` | All donors and supporters (monetary, in-kind, volunteer, skills, advocacy) |
| `donations` | Individual donation events across all types |
| `in_kind_donation_items` | Line-item details for in-kind donations |
| `donation_allocations` | How donation value is distributed across safehouses and program areas |

### Case Management Domain
| Table | Description |
|---|---|
| `residents` | Case records for girls served; modeled after Philippine social welfare agency format |
| `process_recordings` | Dated counseling session notes (Process Recording format) |
| `home_visitations` | Home and field visit records |
| `education_records` | Monthly education progress and attendance |
| `health_wellbeing_records` | Monthly physical health, nutrition, sleep, and energy |
| `intervention_plans` | Individual intervention goals and services; created at case conferences |
| `incident_reports` | Safety and behavioral incident records |

### Outreach and Communication Domain
| Table | Description |
|---|---|
| `social_media_posts` | Social media activity, content, and engagement metrics |
| `safehouse_monthly_metrics` | Pre-aggregated monthly metrics per safehouse |
| `public_impact_snapshots` | Anonymized monthly impact reports for public/donor communication |

### Key Fields to Know
- `residents.initial_risk_level` / `current_risk_level` — track risk change over time
- `residents.reintegration_status` / `reintegration_type` — track placement outcomes
- `donations.referral_post_id` — links donations back to the social media post that referred them
- `social_media_posts.donation_referrals` / `estimated_donation_value_php` — social ROI data
- `intervention_plans.case_conference_date` — used to surface upcoming case conferences
- `supporters.acquisition_channel` — how donors first found the org
- `donations.is_recurring` — identifies recurring donors

---

## Admin Dashboard Specifics

The student working on this is personally responsible for the entire admin dashboard, including:

### Sections
1. **Overall Layout & Navigation** — sidebar/top nav, auth guard, header with user info and logout
2. **Donor Activity** — summary cards, donation trend chart, type/channel/campaign breakdowns, recent donations table, allocation chart
3. **Resident / Safehouse Status** — summary cards, per-safehouse table, risk level breakdown, residents with worsened risk flagged, recent process recordings and incidents feed
4. **Social Media Engagement** — summary cards, engagement by platform/post type, best-time heatmap, donation referral trend, top posts table
5. **ML Predictions / Insights** — donor churn risk table, reintegration readiness list, social media ROI predictor input/output; UI shells built with mock data until teammate's pipelines are ready

### Planned API Endpoints
See `admin-dashboard-objectives.md` for the full endpoint list. Summary:
- `GET /api/dashboard/summary` — top-level summary card data
- `GET /api/donors/summary`, `/api/donations/trends`, `/api/donations/by-type`, etc.
- `GET /api/safehouses/overview`, `/api/residents/risk-summary`, `/api/incidents/recent`, etc.
- `GET /api/social/summary`, `/api/social/posting-heatmap`, `/api/social/top-posts`, etc.
- `GET /api/ml/donor-churn-risk`, `/api/ml/reintegration-readiness`, `POST /api/ml/social-roi-predict`

### Design Principles
- Aggregate on the backend, not the frontend
- Use query params for filtering (date ranges, safehouse, pagination)
- Standardize response envelope: `{ data: [...], total: 100, page: 1 }` for paginated results
- Build ML UI shells with mock data; wire real endpoints when teammate finishes pipelines
- All admin endpoints require authentication (return 401 if not)

---

## Submission Details

- **Final deliverable due:** Friday, April 10 at 10:00 AM
- **Submission form:** Qualtrics link (provided in case doc)
- **Peer eval due:** Friday, April 10 at 11:59 PM
- **Presentations:** Friday starting at 12:00 PM, 20-min demo + 5-min Q&A format
- **Video walkthroughs:** One per class (IS413, IS414, IS455); must be public/unlisted; features not shown in video receive no points
- **GitHub repo:** Must be public for grading
- **Credentials to provide:** Admin user (no MFA), donor user with donation history (no MFA), one account with MFA enabled

---

## Important Constraints

- Do not expose sensitive resident data publicly — all public-facing data must be anonymized and aggregated
- Confirmation dialogs required before any delete operation
- Password policy must be stricter than ASP.NET Identity defaults (per class instruction, not per Microsoft docs)
- CSP must be an HTTP header, not a `<meta>` tag
- ML notebooks must be fully executable top-to-bottom by a TA
- All data paths in notebooks must be correct relative to the repo structure