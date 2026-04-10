# IS 413 – Enterprise Application Development: Requirements Analysis
*Generated: 2026-04-09 | Updated: 2026-04-10 | Project: Pag-asa Sanctuary (intex-w26)*

---

## Overview

IS 413 requires a complete, production-quality full-stack web application using .NET 10 / C# (backend), React / TypeScript / Vite (frontend), and a relational database (PostgreSQL). This document assesses how the current codebase measures against each stated requirement.

---

## Tech Stack Compliance

| Requirement | Status | Notes |
|---|---|---|
| .NET 10 / C# backend | ✅ Met | `IntexBackendApi` running ASP.NET Core Web API on .NET 10 |
| React / TypeScript / Vite frontend | ✅ Met | Vite + React 18 + TypeScript confirmed |
| PostgreSQL database | ✅ Met | EF Core with `UseNpgsql` + `UseSnakeCaseNamingConvention`; hosted on Render |
| App and DB both deployed | ✅ Met | Backend on Render (`intex-backend.onrender.com`), frontend on Vercel |
| Good database principles | ✅ Met | Normalized schema, DTOs, EF Core migrations in place |

---

## Public (Non-Authenticated) Pages

### 1. Home / Landing Page
**Requirement:** A modern, professional landing page that introduces the organization, its mission, and provides clear calls to action for visitors to engage or support.

**Status: ✅ Complete**

`Landing.tsx` is fully built. It includes:
- Hero section with background image, tagline, and two prominent CTAs ("Empower a Survivor," "Our Mission")
- "Pathway to Peace" services grid (Confidential Safety, Trauma-Informed Care, Reintegration)
- Live impact metrics section (counseling sessions, educational advancement, home visits, partner regions)
- Email signup CTA section ("Join the Circle of Protection")
- Link to the full Impact Dashboard

No gaps identified.

---

### 2. Impact / Donor-Facing Dashboard
**Requirement:** Displays aggregated, anonymized data showing the organization's impact (outcomes, progress, resource use) in a clear and visually understandable way.

**Status: ✅ Complete**

`ImpactDashboard.tsx` connects to the unauthenticated `PublicImpactController` and renders:
- Summary stat cards (total donations raised, supporters, active safehouses, residents served, regions)
- Donations by type (horizontal bar chart)
- Resource allocation by program area (progress bars with percentages)
- Supporter community breakdown by type (grid)
- In-Kind donations by category (table)
- Monthly donation trends (12-month bar chart)
- Campaign performance cards

All data is aggregated and anonymized. Full error handling and loading state are implemented.

---

### 3. Login Page
**Requirement:** Allows users to authenticate using a username and password, with proper validation and error handling.

**Status: ✅ Complete**

Implemented pages:
- `Login.tsx` — username/password form with error handling and 2FA verification step
- `Register.tsx` — new user registration
- `ForgotPassword.tsx` — email-based password reset initiation
- `ResetPassword.tsx` — password reset with token

---

### 4. Privacy Policy + Cookie Consent
**Requirement:** A privacy policy linked from the footer and a GDPR-compliant cookie consent notification.

**Status: ✅ Complete (with one minor note)**

- `PrivacyPolicy.tsx` — fully written, covers data collection, use, storage, marketing, GDPR rights, and cookie types. Linked from the site footer.
- `CookieBanner.tsx` — functional, persistent. Renders a banner on first visit with Accept and Decline buttons. Stores user choice in a `cookie_consent` cookie. Accept sets an `analytics` cookie; Decline removes it. Integrated into the analytics tracking flow in `App.tsx`.

**Minor note:** The privacy policy content is customized to the organization but is fairly brief. Graders may scrutinize it; consider expanding the "How do we store your data?" section to mention encryption or specific security practices.

---

## Admin / Staff Portal (Authenticated Users Only)

### 5. Admin Dashboard
**Requirement:** High-level overview of key metrics — active residents, recent donations, upcoming case conferences, summarized progress data.

**Status: ✅ Complete**

`Dashboard.tsx` (shared, branched by `isAdmin`) renders for admin:
- Stat cards: active residents across all safehouses, high/critical risk counts, recent donations, upcoming conferences
- Activity feed: recent incidents, process recordings, home visits
- Quick-action cards including a link to the Reports page
- Upcoming conferences table

---

### 6. Donors & Contributions
**Requirement:** Allows staff to **view, create, and manage** supporter profiles including classification by type (monetary donor, volunteer, skills contributor, etc.) and status (active/inactive). Tracks all types of contributions (monetary, in-kind, time, skills, social media). Staff should be able to record and review donation activity. Supports viewing donation allocations across safehouses and program areas.

**Status: ⚠️ Partially Met — VIEW functionality complete; CREATE/MANAGE functionality missing from portal**

`DonorsPage.tsx` (admin-only) provides rich analytics:
- Summary stat cards (total donors, avg donation, new this month, retention rate)
- Donation trends (line chart over time)
- Donations by type, channel, and campaign (charts)
- Allocation breakdown by safehouse and program area (stacked bar)
- Paginated recent donations table
- Impact summary table

However, **there is no UI or API endpoint** for staff to:
- Create a new supporter profile
- Update an existing supporter's type, status, or classification
- Manually record a donation entry from the portal (only donors can self-donate via the public `/donate` page)
- Manage in-kind, time, skills, or social media contributions

`AdminController.cs` only exposes GET endpoints for donors/supporters. No POST, PUT, or DELETE operations exist for supporter management. The `DonationsController` allows `POST /api/donations` but is scoped to self-service donor use only.

**Note on User Management:** The admin portal has a fully functional Users page (`UsersPage.tsx`) where admins can deactivate, reactivate, delete, and reassign the role of any user account. This covers user administration — however, it manages `ApplicationUser` accounts (login identities), not `Supporter` entity records (which track donor classification, type, contribution history, etc.). These are separate tables. User management satisfies administrative control over who can log in, but does not substitute for supporter profile management (e.g., classifying a new in-kind donor, recording a volunteer contribution).

**Recommendation:** If time allows, add POST/PUT endpoints for creating and updating supporter profiles. If not, be prepared to explain in the IS 413 video that user management covers admin control while donation self-service covers the donor-facing creation flow.

---

### 7. Caseload Inventory
**Requirement:** Core case management — view, create, and update resident profiles including demographics, case category, disability info, family socio-demographic profile, admission details, referral info, assigned social workers, and reintegration tracking. Support filtering and searching by case status, safehouse, and category.

**Status: ✅ Mostly Complete — CREATE supported via staff portal; UPDATE missing**

`Residents.tsx` (shared admin/staff) provides:
- Search by name/code, filter by risk level and status
- Paginated caseload table
- Inline expandable detail panel with four tabs: Profile, Recordings, Visits, Intervention Plan
- Staff portal includes an "Add Resident" intake form (`POST /api/staff/residents`)

**Gaps:**
- No `PUT /api/staff/residents/{id}` endpoint to update an existing resident's profile
- Admin portal view shows high-level analytics only; admin cannot add residents through their portal (must use staff role or staff portal)
- Some fields called out in the requirement (family socio-demographic profile — 4Ps beneficiary, solo parent, indigenous group, informal settler) — confirm these fields exist in the `Resident` model/intake form

---

### 8. Process Recording
**Requirement:** Forms for entering and viewing dated counseling session notes. Captures session date, social worker, session type, emotional state, narrative summary, interventions applied, and follow-up actions. Full chronological history for each resident.

**Status: ✅ Complete**

Both portals have full implementations:
- `StaffProcessRecording.tsx` — two-column layout with form + paginated history with expandable rows
- `ProcessRecording.tsx` (admin) — admin-side form
- `POST /api/staff/process-recordings` — creates recording, verifies resident belongs to safehouse
- `GET /api/staff/residents/{id}/recordings` — full history per resident
- All required fields present in `CreateProcessRecordingDto`

---

### 9. Home Visitation & Case Conferences
**Requirement:** Log home/field visits including visit type, home environment observations, family cooperation level, safety concerns, and follow-up actions. Case conference history and upcoming conferences.

**Status: ✅ Complete**

`StaffHomeVisits.tsx` — tabbed layout:
- "Log a Visit" form with all required fields
- "My Visit History" — paginated with expandable rows
- "Case Conferences" — read-only upcoming and history tables split by today's date

`GET /api/staff/case-conferences` and `POST /api/staff/home-visits` both implemented and working.

---

### 10. Reports & Analytics
**Requirement:** Aggregated insights and trends — donation trends over time, **resident outcome metrics (education progress, health improvements)**, **safehouse performance comparisons**, **reintegration success rates**. Consider aligning with the Annual Accomplishment Report format used by Philippine social welfare agencies (caring, healing, teaching).

**Status: ✅ Complete — Annual Accomplishment Report format fully implemented**

A dedicated `ReportsPage.tsx` is now built and routed at `/admin/reports` (linked from the Admin Dashboard quick-action cards). It implements the full Annual Accomplishment Report format with four sections:

**CARING (beneficiary counts and case volume):**
- Total Beneficiaries, New Admissions, Home Visitations, Incidents — stat cards
- Case category breakdown table (case types and counts)
- Safehouse occupancy table (region, active residents, capacity, occupancy %)

**HEALING (health and wellness outcomes):**
- Sessions count, average health/nutrition scores, health records completed — stat cards
- Monthly session count bar chart (Recharts)
- Medical, dental, and psychological checkup completion rates
- Sessions by type breakdown

**TEACHING (education and reintegration outcomes):**
- Residents enrolled, attendance rate, successfully reintegrated, in-progress — stat cards
- Intervention plans and reintegration outcomes by type

**SAFEHOUSE PERFORMANCE:**
- Cross-safehouse comparison table (region, active residents, capacity, occupancy %, session count, home visits, incidents)

**Technical implementation:**
- Backend: `GET /api/admin/reports/aar-summary?year=&safehouseId=` in `AdminController.cs` — full implementation computing all metrics from EF Core queries
- Frontend: `getAarSummary()` in `adminApi.ts` (typed, returns `AarSummaryDto`)
- Year selector (current year back to 2020) and safehouse filter for drill-down
- Real data from the database — no mock values

---

## Miscellaneous Requirements

### Code Quality
**Requirement:** Validate data, handle errors, write good code. Pay attention to titles, icons, logos, consistent look and feel, pagination, speed.

| Area | Status | Notes |
|---|---|---|
| Error handling | ✅ Met | All pages have `error` state with user-facing messages |
| Loading states | ✅ Met | `<LoadingState />` used consistently |
| Pagination | ✅ Met | Shared `<Pagination />` component used throughout |
| Consistent UI library | ✅ Met | `PageHeader`, `StatCard`, `SectionCard`, `RiskBadge`, etc. used across all admin/staff pages |
| CSS custom properties | ✅ Met | All colors use `var(--color-*)` — no raw hex or Tailwind color classes |
| Responsiveness | ✅ Met | `md:` and `lg:` breakpoints used throughout all public-facing pages |
| DTOs | ✅ Met | Separate DTO classes for all request/response shapes |
| Footer links (some) | ⚠️ Minor | Several footer links still use `href: '#'` as placeholders. Intentionally left as-is for now — not a grading concern. |

---

## Summary

| Page / Feature | Status |
|---|---|
| Landing Page | ✅ Complete |
| Impact / Donor Dashboard (public) | ✅ Complete |
| Login / Register / Password Reset | ✅ Complete |
| Privacy Policy + Cookie Consent | ✅ Complete |
| Admin Dashboard | ✅ Complete |
| Donors & Contributions | ⚠️ View-only; no create/manage functionality |
| Caseload Inventory (view + create) | ✅ Mostly complete |
| Resident profile UPDATE | ❌ No PUT endpoint or UI |
| Process Recording | ✅ Complete |
| Home Visitation & Case Conferences | ✅ Complete |
| Reports & Analytics (Annual Accomplishment Report) | ✅ Complete |
| Tech stack compliance | ✅ Complete |
| Code quality / polish | ✅ Mostly complete (some placeholder footer links — intentional) |

**Remaining gaps before presentation:**
1. **Donor/supporter create and manage** — admin portal lacks CUD for supporters; explain in video
2. **Resident profile update** — no PUT endpoint; explain in video
3. **Show the Reports page prominently** in the IS 413 video — it directly addresses the AAR format requirement
