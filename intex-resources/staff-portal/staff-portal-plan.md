# Staff Portal — Implementation Plan

> **Project:** Pag-asa Sanctuary
> **Scope:** Staff-role authenticated portal (`/staff/*`)
> **Stack:** React + TypeScript (Vite) frontend, .NET 10 / C# backend, existing design system

---

## Overview

The staff portal is a scoped version of the admin portal. Staff users are authenticated via RBAC with the `Staff` role and are each assigned to a single safehouse, stored on their user profile. All data displayed to staff is filtered to their assigned safehouse unless otherwise noted.

**Staff can:**
- View resident statistics and caseload for their assigned safehouse
- Create new resident intake records (submitted as `Pending`, requiring admin approval)
- Submit process recording (counseling session) forms
- Submit home visitation and case conference forms
- View their own submission history for recordings and visits
- View ML insights

**Staff cannot:**
- View or manage users
- View social media statistics
- View org-wide donor statistics or donor profiles
- Approve or delete any records
- View data from safehouses other than their own

---

## Routing Changes

### `App.tsx`

Add the following routes inside the `/staff` protected route block:

```tsx
<Route path="process-recording" element={<StaffProcessRecording />} />
<Route path="home-visits" element={<StaffHomeVisits />} />
```

The existing routes (`dashboard`, `residents`, `ml`) remain, but their underlying components must be updated to support safehouse-scoping (see per-page details below).

---

## Sidebar Navigation (`StaffLayout.tsx`)

Update `baseNavItems` to include the two new pages:

| Label | Route | Icon |
|---|---|---|
| Overview | `/staff/dashboard` | ⊞ |
| Residents | `/staff/residents` | 🏠 |
| Process Recording | `/staff/process-recording` | 📋 |
| Home Visitation | `/staff/home-visits` | 🏡 |
| ML Insights | `/staff/ml` | 🤖 |

---

## Page 1 — Staff Dashboard

**Route:** `/staff/dashboard`
**Component:** `Dashboard.tsx` (shared with admin, already has `isAdmin` branching)
**Status:** Exists — requires data-scoping changes

### Requirements

#### Stat Cards
When rendered in the staff context (`!isAdmin`), the dashboard must fetch safehouse-scoped data. All four stat cards should reflect only the staff user's assigned safehouse:

| Card | Metric |
|---|---|
| Active Residents | Count of active residents at their safehouse |
| High / Critical Risk | Count of active residents at their safehouse with risk level High or Critical |
| My Recordings This Month | Count of process recordings submitted by the logged-in user in the current calendar month |
| Upcoming Conferences | Count of upcoming case conferences at their safehouse |

#### Quick Action Cards
The two existing quick-action cards are already implemented and point to `${base}/dashboard/home-visits` and `${base}/dashboard/process-recording`. Update these links to point to the new direct routes:

- "Record a Visitation" → `/staff/home-visits`
- "Record a Process Session" → `/staff/process-recording`

#### Domain Navigation Cards
When `!isAdmin`, hide the Donor Activity and Social Media cards. Show only:
- Residents → `/staff/residents`
- ML Insights → `/staff/ml`

#### Activity Feed
Filter the recent activity feed to events from the staff user's assigned safehouse only (process recordings, incidents, home visits). The `getDashboardActivity()` API call should pass the user's `safehouseId` as a query parameter when the user is a staff member.

#### Upcoming Conferences
Filter to conferences associated with residents at the staff user's safehouse.

### Backend Requirements
- `GET /api/dashboard/summary` — accept optional `?safehouseId=` param; when provided, scope all aggregate counts to that safehouse and add a `myRecordingsThisMonth` field scoped to the requesting user
- `GET /api/dashboard/activity` — accept optional `?safehouseId=` param
- `GET /api/dashboard/conferences` — accept optional `?safehouseId=` param

---

## Page 2 — Staff Residents

**Route:** `/staff/residents`
**Component:** `Residents.tsx` (shared with admin) — requires significant branching
**Status:** Exists — requires safehouse-scoping, inline detail panel, and intake form

### Requirements

#### Stat Cards
When `!isAdmin`, scope all four stat cards to the staff user's assigned safehouse:
- Active Residents (at their safehouse)
- High / Critical Risk (at their safehouse)
- Reintegration In Progress (at their safehouse)
- Upcoming Conferences (at their safehouse)

#### Safehouse Overview Section
When `!isAdmin`, replace the multi-safehouse overview table with a single **My Safehouse** summary card showing:
- Safehouse name and region
- Occupancy bar (current / capacity)
- Average education progress
- Average health score
- Process recordings this month
- Incidents this month

#### Caseload Table
A searchable, filterable table of all residents at the staff user's safehouse.

**Columns:**
- Resident Code (anonymized internal identifier)
- Case Category (e.g., Trafficked, Physical Abuse, Neglected)
- Risk Level (badge: Low / Medium / High / Critical)
- Admission Date
- Assigned Social Worker
- Status (Active / Reintegrating / Pending)

**Filters:**
- Search by resident code (text input)
- Filter by risk level (dropdown)
- Filter by case status (dropdown)

**"Add Resident" button** — visible to staff, opens the intake form (see below). Positioned in the page header area consistent with the admin design pattern.

#### Inline Resident Detail Panel
Clicking any resident row expands an inline panel directly below that row (accordion-style). The expanded panel contains:

**Profile Summary tab:**
- Demographics (age, sex, civil status — no full name displayed for privacy)
- Case category and sub-categories
- Disability information
- Family socio-demographic profile (4Ps beneficiary, solo parent, indigenous group, informal settler)
- Admission date and referral source
- Assigned social worker(s)

**Process Recordings tab:**
- Chronological list of all process recordings for this resident
- Each entry shows: date, session type, emotional state, social worker, concerns flagged
- Expandable to show full narrative and follow-up notes
- "Submit New Recording for This Resident" button — links to `/staff/process-recording` with the resident pre-selected

**Home Visits tab:**
- Chronological list of all home visits for this resident
- Each entry shows: date, visit type, location, safety concerns flagged
- Expandable to show full observations and outcome
- "Submit New Visit for This Resident" button — links to `/staff/home-visits` with the resident pre-selected

**Intervention Plan tab:**
- Current intervention plan description
- Goals and target dates (read-only for staff)

#### Add Resident Intake Form
Triggered by the "Add Resident" button. Rendered as a slide-in side panel or full-page modal. On submit, the record is written to the database with `Status = Pending`. Staff see a "Pending admin review" badge on newly submitted residents in their caseload table.

**Form fields:**

| Field | Type | Notes |
|---|---|---|
| Internal Code | Text | Auto-generated or manually assigned |
| Date of Admission | Date | |
| Referral Source | Text | Organization or individual who referred |
| Assigned Social Worker | Select | Dropdown of staff at the safehouse |
| Safehouse | Read-only | Pre-filled from staff user's assignment |
| Case Category | Select | Trafficked, Physical Abuse, Sexual Abuse, Neglect, Abandoned, Other |
| Case Sub-categories | Multi-select | |
| Sex | Select | Female / Male / Other |
| Age at Admission | Number | |
| Civil Status | Select | |
| Disability | Checkbox + text | If yes, describe |
| 4Ps Beneficiary | Checkbox | |
| Solo Parent Household | Checkbox | |
| Indigenous Group | Checkbox | |
| Informal Settler | Checkbox | |
| Initial Risk Level | Select | Low / Medium / High / Critical |
| Notes | Textarea | Additional intake notes |

**Validation:** All required fields must be filled before submission. Display inline field-level error messages.

**On submit:** POST to `/api/residents` with `status: "Pending"`. Show a success toast. The new resident appears in the caseload table with a "Pending" badge.

### Backend Requirements
- `GET /api/residents` — accept `?safehouseId=` to return only residents for that safehouse
- `GET /api/residents/:id/recordings` — process recordings for a specific resident
- `GET /api/residents/:id/visits` — home visits for a specific resident
- `GET /api/residents/:id/intervention-plan` — current intervention plan
- `POST /api/residents` — create new resident with `status: "Pending"`
- `GET /api/residents/summary?safehouseId=` — safehouse-scoped stat cards
- Admin endpoint update: `GET /api/residents` (admin view) should surface Pending records with a reviewable flag

---

## Page 3 — Process Recording

**Route:** `/staff/process-recording`
**Component:** `StaffProcessRecording.tsx` (new file)
**Status:** New page — restyle existing form + connect to backend

### Layout
Two-column layout on desktop (form left, history right). Single-column stacked on mobile.

### Submission Form

**Section: Session Details**

| Field | Type | Required | Notes |
|---|---|---|---|
| Resident | Select | Yes | Dropdown of active residents at the staff's safehouse |
| Session Date | Date | Yes | Defaults to today |
| Social Worker | Text | Yes | Pre-filled from logged-in user's name; editable |
| Session Type | Select | Yes | Individual / Group |

**Section: Session Content**

| Field | Type | Required | Notes |
|---|---|---|---|
| Emotional State Observed | Select | Yes | Calm / Anxious / Withdrawn / Agitated / Distressed / Stable |
| Narrative Summary | Textarea | Yes | Full account of the session; min. 50 characters |
| Interventions Applied | Textarea | No | Description of techniques or interventions used |
| Follow-up Actions | Textarea | No | Planned next steps |
| Concerns Flagged | Checkbox | No | If checked, adds a visual warning indicator to the record |

**Submit button:** "Save Recording" — disabled until all required fields are filled. On success, shows a toast notification and resets the form. The new submission immediately appears in the history panel.

### My Submission History

Displayed to the right of the form (or below on mobile). Title: "My Recordings".

**Table columns:**
- Date
- Resident Code
- Session Type
- Emotional State
- Concerns (badge if flagged)

Sorted newest-first. Paginated (10 per page). Each row is expandable to reveal the full narrative, interventions, and follow-up notes inline.

**Filter:** Dropdown to filter history by resident (all residents at their safehouse).

### Backend Requirements
- `POST /api/process-recordings` — create a new recording; associate with logged-in user's ID
- `GET /api/process-recordings?submittedBy=me` — return recordings submitted by the logged-in user, newest-first
- `GET /api/residents?safehouseId=&status=Active` — for the resident dropdown

---

## Page 4 — Home Visitation & Case Conferences

**Route:** `/staff/home-visits`
**Component:** `StaffHomeVisits.tsx` (new file)
**Status:** New page — restyle existing form + connect to backend

### Layout
The page is divided into three sections, presented as tabs or clearly delineated sections with anchor links:
1. Log a Visit (form)
2. My Visit History
3. Case Conferences

### Section 1 — Log a Visit Form

**Section: Visit Details**

| Field | Type | Required | Notes |
|---|---|---|---|
| Resident | Select | Yes | Active residents at the staff's safehouse |
| Visit Date | Date | Yes | Defaults to today |
| Social Worker | Text | Yes | Pre-filled from logged-in user |
| Visit Type | Select | Yes | Initial Assessment / Routine Follow-up / Reintegration Assessment / Post-Placement Monitoring / Emergency |
| Location Visited | Text | Yes | Address or description of the location |
| Family Members Present | Text | No | Names or relationship roles |

**Section: Observations**

| Field | Type | Required | Notes |
|---|---|---|---|
| Purpose of Visit | Textarea | Yes | Why the visit was conducted |
| Observations | Textarea | Yes | What was observed during the visit |
| Family Cooperation Level | Select | Yes | Cooperative / Partially Cooperative / Uncooperative |
| Safety Concerns Noted | Textarea | No | Description of any safety concerns |
| Safety Concern Flagged | Checkbox | No | Prominently marks the record as having a safety concern |

**Section: Outcomes**

| Field | Type | Required | Notes |
|---|---|---|---|
| Visit Outcome | Textarea | Yes | Summary of what was accomplished or concluded |
| Follow-up Needed | Checkbox | No | If checked, reveals follow-up notes field |
| Follow-up Notes | Textarea | Conditional | Required if Follow-up Needed is checked |

**Submit button:** "Save Visit Record" — on success, shows a toast and resets the form. New visit immediately appears in Visit History.

### Section 2 — My Visit History

A table or card list of all home visits submitted by the logged-in staff user.

**Table columns:**
- Visit Date
- Resident Code
- Visit Type
- Safety Concern (badge if flagged)
- Follow-up Required (badge if yes)

Sorted newest-first. Each row expandable to show full observations, cooperation level, outcome, and follow-up notes.

### Section 3 — Case Conferences (Read-Only)

Two sub-sections: **Upcoming** and **History**. Both scoped to residents at the staff user's safehouse. Staff cannot create or edit case conferences from this view — that is an admin function.

**Upcoming Conferences:**

| Column | Notes |
|---|---|
| Date | Formatted as Month DD, YYYY |
| Resident Code | Anonymized |
| Description / Plan | Brief summary of conference purpose |
| Status | Upcoming badge |

**Conference History:**

| Column | Notes |
|---|---|
| Date | |
| Resident Code | |
| Description / Plan | |
| Status | Completed badge |

### Backend Requirements
- `POST /api/home-visits` — create a new home visit record; associate with logged-in user's ID
- `GET /api/home-visits?submittedBy=me` — return visits submitted by the logged-in user
- `GET /api/case-conferences?safehouseId=` — return conferences for the safehouse (upcoming and completed)

---

## Page 5 — ML Insights

**Route:** `/staff/ml`
**Component:** `MLPage.tsx` (shared, no changes needed)
**Status:** Already implemented and routed — no changes required

---

## Design System Notes

All new components must follow the existing design conventions:

- Use `SectionCard`, `StatCard`, `PageHeader`, `LoadingState`, `Pagination`, `RiskBadge`, and `Breadcrumbs` from `src/components/admin/`
- Use CSS custom properties (`var(--color-primary)`, `var(--color-surface-container-low)`, etc.) for all colors — no raw hex or Tailwind color classes
- Form inputs should use the `.form-input` class pattern consistent with the rest of the site
- Success/error feedback via toast notifications (consistent with existing patterns)
- Tables use the `.table-container` + `<table>` pattern already established
- All pages must be responsive (single-column on mobile, multi-column on desktop)
- Accessibility: all interactive elements must have `aria-label` attributes where icon-only; Lighthouse score target ≥ 90

---

## Security & Authorization Notes

- All staff API endpoints must verify the `Staff` or `Admin` role via the existing ASP.NET Identity authorization middleware
- Staff endpoints that accept a `safehouseId` must validate server-side that the requesting user's profile matches that safehouse — never trust the client to self-report their safehouse
- The `Pending` status on new resident records must be set server-side, not client-side
- Staff must not be able to access `/admin/*` routes — this is already enforced by the `ProtectedRoute` component's `allowedRoles` check
- Process recordings and home visits submitted by staff should store the `userId` of the submitting user on the record for audit purposes

---

## Summary of New Files

| File | Description |
|---|---|
| `src/pages/(staff)/dashboard/StaffDashboard.tsx` | Staff-scoped dashboard (or update shared `Dashboard.tsx` with isAdmin branching) |
| `src/pages/(staff)/residents/StaffResidents.tsx` | Staff caseload with inline panel + intake form (or update shared `Residents.tsx`) |
| `src/pages/(staff)/process-recording/StaffProcessRecording.tsx` | New process recording form + history |
| `src/pages/(staff)/home-visits/StaffHomeVisits.tsx` | New home visitation form + history + case conferences |

---

## Summary of Modified Files

| File | Change |
|---|---|
| `src/App.tsx` | Add `/staff/process-recording` and `/staff/home-visits` routes |
| `src/pages/(staff)/StaffLayout.tsx` | Add Process Recording and Home Visitation nav items |
| `src/pages/(admin)/dashboard/Dashboard.tsx` | Scope stat cards, activity, and conferences to safehouse when `!isAdmin` |
| `src/pages/(admin)/residents/Residents.tsx` | Scope to safehouse, add inline panel, add intake form when `!isAdmin` |
| `src/lib/adminApi.ts` | Add safehouse-scoped API calls and staff-specific endpoints |
