# INTEX W26 — Action Items Before Submission
*Compiled: 2026-04-09 | Due: Friday April 10 at 10:00 AM*

---

## 🔴 Critical (affects grading directly)

### IS 455 — Team Decision: Notebook submission folder structure
The case requires notebooks to be in an `ml-pipelines/` folder at the **repo root**, named descriptively (e.g., `donor-churn-classifier.ipynb`). Currently the notebooks live inside `pipeline/[name]/notebooks/`. Before submission:
- Copy or surface the `master_crispdm_pipeline.ipynb` from each pipeline into a top-level `ml-pipelines/` folder with descriptive names, OR
- Confirm with the team whether linking graders directly to the subdirectory paths is acceptable per the submission form.
- **This affects whether TAs can find and evaluate your notebooks at all.**

### IS 414 — Set up the three required test accounts
The submission form requires three login credentials:
1. **Admin account WITHOUT 2FA** — for graders to access admin features
2. **Donor account WITHOUT 2FA** — for graders to access donor features
3. **Any account WITH 2FA ENABLED** — for graders to verify 2FA is enforced (they won't log in, just confirm the code prompt appears)

⚠️ Forgot Password ≠ 2FA. These are different features. 2FA is the email code sent *during login* when `TwoFactorEnabled = true` on an account. Make sure account #3 actually has 2FA toggled on. If there's no UI for this yet, it can be enabled manually via the `/api/auth/enable-2fa` endpoint or directly in the database. Make sure credentials for all three are ready to paste into the Qualtrics submission form.

##### EDIT: Fixed
2FA is implemented into the sign on now, with the option for a user to enable or disable in the profile card with a toggle.

The three accounts to be used are:
1. **Admin account**: does not have 2FA enabled (email doesn't exist)
2. **Matt's account**: donor account (has donation history, no 2FA)
3. **Lincoln's account**: has 2FA enabled

### IS 455 — Team Decision: Reintegration + Social Media mock data
The MLPage shows **hardcoded mock predictions** for both Resident Reintegration and Social ROI. The trained models exist (`reintegration_model.joblib`, `recommendation_model.joblib`) but are not connected to the web app. Decide as a team:
- **Option A:** Connect to real models before Friday (requires adding API endpoints and updating the MLPage)
- **Option B:** Accept partial credit on the Deployment stage for these pipelines

If choosing Option A for Reintegration: check whether `resident_reintegration_scores` already has data in Supabase from a prior inference run. If yes, a simple `GET /api/admin/ml/reintegration-scores` endpoint is all that's needed — low effort, high impact.

### IS 455 — Team Decision: Safehouse Outcome Drivers pipeline
This pipeline has notebooks (01–05) but **no saved model artifact** and **is not in the web app**. There is also no `master_crispdm_pipeline.ipynb`. Decide:
- **Option A:** Someone finishes training the model, saves the artifact, and adds it to the web app before Friday
- **Option B:** Submit the notebooks for partial credit on the early pipeline stages (framing, data prep, exploration); be transparent in the video that deployment was not completed
- **Do not present it in the video as complete if it isn't** — this is considered academic misconduct per the case instructions

---

## 🟡 Important (likely affects points, lower effort)

### IS 414 — Confirm 2FA has a working UI
The backend has full 2FA support (`enable-2fa`, `disable-2fa`, `verify-2fa` endpoints), but it's unclear whether there's a frontend UI where a user can toggle 2FA on/off (e.g., a profile/settings page). If there's no UI, graders can't see how a user would enable it. Either:
- Build a simple profile/settings toggle, OR
- Manually enable 2FA on the test account before submission and explain in the video that a UI is planned

##### EDIT: Fixed
Dropdown error in the profile card allows user to toggle 2FA on or off. There is also a page to enter the verification code.

### IS 413 — Reports & Analytics: be explicit in the video
There is no dedicated Reports & Analytics page. Reporting is fragmented across the DonorsPage, Residents page, Safehouses page, and MLPage. More importantly, the **Annual Accomplishment Report format** (caring/healing/teaching beneficiary counts) is not implemented. In the IS 413 video:
- Acknowledge this explicitly rather than trying to pass off the existing pages as a full Reports page
- Point to where each type of reporting data *does* appear
- Be forthright about the Annual Accomplishment Report format not being built

### IS 413 — Resident profile UPDATE endpoint missing
Staff can create residents (`POST /api/staff/residents`) and view them, but there is no `PUT /api/staff/residents/{id}` to update an existing resident's profile. If a case changes (status, assigned social worker, reintegration tracking update), there's no way to edit that from the portal.

### IS 413 — Footer placeholder links
Several footer links still use `href: '#'` as placeholders: Our Mission, Impact, About Us, Our Team, Donate, Volunteer, Partner, Careers, Annual Reports, News, FAQ. These are visible to judges during the live presentation demo and look unfinished. Quick fix — either wire to existing pages or remove the broken links.

##### EDIT: Fixed
These are still placeholders, they're just not important. Leave as placeholders.

---

## 🟢 Low Priority / Nice to Have

### IS 413 — Donor/Supporter create and manage
The Donors & Contributions page is view/analytics only. There is no UI or API for staff to create a new supporter profile or record a contribution manually. The Users page covers login account management but not supporter entity management. If time allows, adding this would satisfy the full requirement; otherwise note it in the video.

### IS 414 — RBAC: prepare your explanation for Staff CUD
The rubric says "only admin user can CUD." Your Staff role can Create records (residents, process recordings, home visits). This is intentional and necessary for the use case, but a strict reading could result in partial credit. Prepare a clear one-sentence explanation for the video: *"Staff have Create-only access, scoped to their own safehouse server-side. Admin retains full CUD authority including the ability to view, modify, and delete all records."*

### IS 414 — Privacy policy storage detail
The "How do we store your data?" section is brief. Consider adding one sentence mentioning encrypted database storage or cloud hosting (Render/Supabase) to strengthen it before the video.

##### EDIT: Fixed
Add a little bit more info on this on the privacy policy page.

### IS 455 — Confirm all master notebooks have sections 5 and 6
Each submitted notebook must include a **Causal and Relationship Analysis** section (section 5 — correlation vs. causation discussion, defensibility of causal claims) and a **Deployment Notes** section (section 6 — how the model is deployed, where the integration code lives in the repo). These sections are often forgotten or thin. Review each `master_crispdm_pipeline.ipynb` before submission to confirm both are present and substantive.

---

## Video Checklist Summary

| Class | Must show in video |
|---|---|
| IS 413 | Landing, Impact Dashboard, Login, Privacy Policy, Cookie consent, Admin Dashboard, Caseload/Residents, Process Recording, Home Visits; acknowledge Reports gap and Donor management gap |
| IS 414 | HTTPS URL, login/password auth, lockout, better password validation, protected routes, RBAC demo, delete confirmation modal, empty appsettings.json + Render env vars, privacy policy, cookie consent accept/decline + DevTools cookies, CSP header in DevTools, 2FA flow (enable → login → code prompt → verify), Google Sign-In, HSTS header in DevTools |
| IS 455 | Donor risk scores (live data), outreach profiles, upgrade candidates (all real); reintegration and social ROI (flag if mock or real); each pipeline's notebook structure showing all 6 required sections |
