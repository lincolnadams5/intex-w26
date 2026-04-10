# INTEX W26 — Action Items Before Submission
*Compiled: 2026-04-09 | Updated: 2026-04-10 | Due: Friday April 10 at 10:00 AM*

---

## 🔴 Critical (affects grading directly)

### IS 455 — Confirm notebook submission folder structure
The case requires notebooks to be in an `ml-pipelines/` folder at the **repo root**, named descriptively (e.g., `donor-churn-classifier.ipynb`). Currently the notebooks live inside `pipeline/[name]/notebooks/`. Before submission:
- Copy or surface the `master_crispdm_pipeline.ipynb` from each pipeline into a top-level `ml-pipelines/` folder with descriptive names, OR
- Confirm with the team whether linking graders directly to the subdirectory paths is acceptable per the submission form.
- **This affects whether TAs can find and evaluate your notebooks at all.**

### IS 455 — Safehouse Outcome Drivers: no master notebook
No `master_crispdm_pipeline.ipynb` exists for the Safehouse Outcome Drivers pipeline. Without it, graders have no single-document view of the full CRISP-DM process for this pipeline. Also, no trained model artifact exists yet (only `artifacts/runs/` is present). Decide:
- **Option A:** Train the model, save the artifact, create the master notebook, and wire the backend endpoints to an MLPage section before submission
- **Option B:** Submit the five notebooks for partial credit; acknowledge in the video that deployment was not completed
- **Do not present it in the video as complete if it isn't** — this is considered academic misconduct per the case instructions

### IS 414 — Set up the three required test accounts ✅ Done
~~The submission form requires three login credentials...~~

##### STATUS: FIXED
The three accounts to use:
1. **Admin account** — 2FA not enabled (email doesn't exist)
2. **Matt's account** — donor account (has donation history, no 2FA)
3. **Lincoln's account** — 2FA enabled ← graders use this to see the email code prompt

---

## 🟡 Important (likely affects points, lower effort)

### IS 455 — Reintegration MLPage connection
The inference job (`score_residents.py`) and nightly GitHub Actions workflow are both in place. The backend `AdminController.cs` already has a try/catch attempting to read from `resident_reintegration_scores`. However, **MLPage still renders mock data** (`MOCK_REINTEGRATION`). Steps to fix:
1. Confirm whether `resident_reintegration_scores` has data in Supabase (from a prior inference run)
2. If yes, update MLPage to call the backend endpoint instead of the hardcoded array
3. This converts the Deployment stage from "mock only" to "real data" — significant grading impact

### IS 455 — Confirm sections 5 and 6 in all master notebooks
Each submitted notebook must include a **Causal and Relationship Analysis** section (section 5 — correlation vs. causation discussion, defensibility of causal claims) and a **Deployment Notes** section (section 6 — how the model is deployed, where the integration code lives in the repo). These sections are often thin or missing. Review each `master_crispdm_pipeline.ipynb` before submission to confirm both are present and substantive.

### IS 455 — Social media FastAPI proxy not deployable
`POST /api/admin/social/score-post` proxies to `http://localhost:8001/score` — this will 503 in production on Render since there's no FastAPI server running there. If the interactive scoring tool is shown in the video, be aware it won't work live. Options:
- Deploy the FastAPI server separately and update the backend URL
- Wire the MLPage to use `getSocialMlSummary` / `getSocialMlTopPosts` instead of the interactive mock, which reads from Supabase and doesn't require a separate server

### IS 413 — Show the Reports page in the IS 413 video ✅ Now built
~~There is no dedicated Reports & Analytics page...~~

##### STATUS: FIXED
`ReportsPage.tsx` is now fully built at `/admin/reports` with the Annual Accomplishment Report format (Caring / Healing / Teaching / Safehouse Performance). It uses real API data. **Make sure this page is prominently shown in the IS 413 video** — it directly satisfies the AAR format requirement that was previously missing.

### IS 414 — Confirm 2FA UI works end-to-end ✅ Done
~~It's unclear whether there's a frontend UI...~~

##### STATUS: FIXED
- `ProfileCard.tsx` has a toggle switch to enable/disable 2FA (`user.twoFactorEnabled`)
- `Login.tsx` and `LoginForm.tsx` handle the verify-2fa step when login returns `requires2FA: true`
- Full end-to-end flow is implemented

### IS 413 — Resident profile UPDATE endpoint missing
Staff can create residents (`POST /api/staff/residents`) and view them, but there is no `PUT /api/staff/residents/{id}` to update an existing resident's profile. If a case changes (status, assigned social worker, reintegration tracking), there's no edit path from the portal. Note this in the IS 413 video rather than ignoring it.

### IS 414 — RBAC: prepare your explanation for Staff CUD
The rubric says "only admin user can CUD." Your Staff role can Create records (residents, process recordings, home visits). Prepare a clear one-sentence explanation for the video: *"Staff have Create-only access, scoped to their own safehouse server-side. Admin retains full CUD authority including the ability to view, modify, and delete all records."*

---

## 🟢 Low Priority / Nice to Have

### IS 413 — Donor/Supporter create and manage
The Donors & Contributions page is view/analytics only. There is no UI or API for staff to create a new supporter profile or record a contribution manually. If time allows, adding this would satisfy the full requirement; otherwise note it in the video.

### IS 414 — Privacy policy storage detail ✅ Done
~~The "How do we store your data?" section is brief...~~

##### STATUS: FIXED
Added additional detail about encrypted database storage and cloud hosting.

### IS 413 — Footer placeholder links
Several footer links still use `href: '#'` as placeholders. Team decided these are acceptable to leave as-is — not a grading concern.

---

## Video Checklist Summary

| Class | Must show in video |
|---|---|
| IS 413 | Landing, Impact Dashboard, Login, Privacy Policy, Cookie consent, Admin Dashboard, Caseload/Residents, Process Recording, Home Visits, **Reports page (Annual Accomplishment Report format)** — acknowledge Donor management gap and Resident update gap |
| IS 414 | HTTPS URL, login/password auth, lockout, better password validation, protected routes, RBAC demo (staff vs admin), delete confirmation modal, empty appsettings.json + Render env vars, privacy policy, cookie consent accept/decline + DevTools cookies, CSP header in DevTools, 2FA flow (enable toggle in profile card → log in → email code prompt → verify code → get in), Google Sign-In, HSTS header in DevTools |
| IS 455 | Donor risk scores (live data), outreach profiles, upgrade candidates; reintegration (flag whether live or mock); safehouse outcome coefficients if available; social ROI (flag if mock); each pipeline's notebook structure showing all 6 required sections |
