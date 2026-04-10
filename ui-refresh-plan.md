# Pag-asa Sanctuary — UI Refresh Implementation Plan

> Target agent: Claude Code (or equivalent) with full repo access.
> Scope: Frontend only. No backend, DB, or API changes.
> Read `CLAUDE.md` at the repo root before starting — all conventions there still apply.

---

## Decisions already made (do not re-ask the user)

1. **Width**: Dashboards should fill the **full viewport width** with no `max-width` cap. Use side padding (`px-6` on desktop, `px-4` on tablet, `px-3` on mobile) but let content stretch edge-to-edge otherwise.
2. **Multi-step forms**: Convert Process Recording and Home Visitation forms into a **4-step wizard** (Basics → Observations → Interventions/Follow-up → Review & Submit). Step 4 is a read-only summary of everything entered before the user clicks Submit.
3. **Success feedback**: Use a **toast notification** (top-right corner, auto-dismiss ~4s, green `var(--color-primary)` accent, checkmark icon) on successful save. Error toasts use `var(--color-error)`.
4. **Mobile breakpoint target**: Support **down to 375px** (iPhone SE). Sidebars collapse to a hamburger drawer, stat cards stack, and wide tables become card/list layouts on `< 640px`.
5. **Scope**: Apply changes to **both** admin (`/admin/*`) and staff (`/staff/*`) portals wherever the affected components are shared.

---

## Guardrails (from CLAUDE.md — re-enforced)

- **Colors**: CSS variables only (e.g., `var(--color-primary)`). Never introduce raw hex or Tailwind color classes like `bg-red-500`.
- **API calls**: Always use `authFetch` from `src/lib/api.ts`. No direct `fetch()`.
- **Shared UI primitives**: Use existing `components/admin/*` (`PageHeader`, `StatCard`, `SectionCard`, `LoadingState`, `Pagination`, `RiskBadge`, etc.). If you need a new primitive (e.g., `Toast`, `Stepper`, `ProgressBar`), add it under `components/admin/` so both portals share it.
- **Staff auth**: Never trust client-side `safehouseId`. The backend already derives it server-side; do not change this.
- **Loading/error states**: Every page keeps `<LoadingState />` and the existing error pattern.
- **Pagination**: Continue to use `<Pagination />`; default page size 10.
- **Do not change**: Backend controllers, DTOs, DB schema, auth policies, or any file under `backend/`.

---

## Phase 0 — Prep & inventory (do this first, before writing code)

1. Read these files to understand current state:
   - `frontend/src/pages/(admin)/AdminLayout.tsx`
   - `frontend/src/pages/(staff)/StaffLayout.tsx`
   - `frontend/src/pages/(admin)/dashboard/Dashboard.tsx` (shared; note the current `max-w-[1200px]` on line ~73 — this must be removed)
   - `frontend/src/pages/(admin)/residents/Residents.tsx` (shared)
   - `frontend/src/pages/(admin)/donors/` (DonorsPage)
   - `frontend/src/pages/(admin)/social/` (SocialPage)
   - `frontend/src/pages/(admin)/ml/` (MLPage)
   - `frontend/src/pages/(admin)/users/` (UsersPage)
   - `frontend/src/pages/(admin)/safehouses/`
   - `frontend/src/pages/(admin)/dashboard/process-recording/ProcessRecording.tsx`
   - `frontend/src/pages/(admin)/dashboard/home-visitation/HomeVisits.tsx`
   - `frontend/src/pages/(staff)/process-recording/StaffProcessRecording.tsx`
   - `frontend/src/pages/(staff)/home-visits/StaffHomeVisits.tsx`
   - `frontend/src/components/admin/PageHeader.tsx`, `SectionCard.tsx`, `StatCard.tsx`
   - `frontend/src/index.css` (to understand existing CSS vars and utility classes like `.table-container`, `.card`, `.badge`)
2. Grep for every occurrence of `max-w-[` and `max-w-screen` and `max-w-7xl` etc. across `frontend/src/pages/` and `frontend/src/components/` and list them — these are the constraints you will be removing or replacing.
3. Grep for `grid-cols-` to identify where responsive grid changes are needed.
4. Grep for `<table` to find every table that needs a mobile card-list fallback.

Produce a short inventory (can be inline in commit message) before changing anything.

---

## Phase 1 — Full-width viewport layout

### 1.1 Remove width caps from shared layouts

- **`AdminLayout.tsx`** and **`StaffLayout.tsx`**:
  - Ensure the main content area has `flex-1 w-full` and no `max-w-*` class.
  - Padding: `px-3 sm:px-4 lg:px-6 py-4 lg:py-6` on the main content wrapper.
  - Sidebar should be `w-64` on `lg+`, hidden on `< lg` behind a hamburger (see Phase 2).

### 1.2 Remove width caps from page components

- `Dashboard.tsx`: remove `max-w-[1200px]` on line ~73. Replace with `w-full`.
- Apply the same sweep to every page under `pages/(admin)/*` and `pages/(staff)/*`. If a page wraps content in `max-w-7xl mx-auto` or similar, strip that wrapper.
- Root of each page should be `<div className="flex flex-col gap-6 w-full">`.

### 1.3 Make grids actually use the extra space

When removing width caps, bump the max column counts on wide screens so stat cards and charts don't just grow to huge sizes:

- Stat card grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-4`
- Two-column content rows (e.g., chart + side list): `grid-cols-1 lg:grid-cols-2 xl:grid-cols-3` where the chart spans `xl:col-span-2`.
- For `Dashboard.tsx` specifically: activity feed + quick actions should become a `lg:grid-cols-3` layout with main content `lg:col-span-2`.

### 1.4 Charts

Recharts components should use `<ResponsiveContainer width="100%" height={300}>` (or the existing height). Remove any hardcoded `width={...}` on charts. Verify `DonorsPage`, `MLPage`, `SocialPage`, `Dashboard` charts all use ResponsiveContainer.

---

## Phase 2 — Responsive / mobile support (target: 375px → 4K)

### 2.1 Layout chrome (Admin + Staff sidebars)

Both `AdminLayout.tsx` and `StaffLayout.tsx` need:

1. A **mobile top bar** visible only on `< lg`: shows the portal title, a hamburger button (left), and the user menu (right).
2. A **slide-out drawer** for the sidebar on `< lg`. Use a simple `useState` for `isNavOpen` — no new library. Animate with Tailwind transitions.
3. Sidebar backdrop: semi-transparent overlay using `bg-black/40` (the one exception where Tailwind opacity is fine because it's not a brand color).
4. Close drawer on route change (use `useEffect` on `location.pathname`).
5. On `lg+`, the sidebar is always visible (existing behavior).

Create a single shared component if the markup is almost identical between Admin and Staff layouts: `components/admin/MobileNavShell.tsx` that takes `title`, `navItems`, `userMenu` props. Otherwise keep them separate — do not over-engineer.

### 2.2 Stat cards

- At `< 640px`: single column (`grid-cols-1`).
- At `sm` (640px+): `grid-cols-2`.
- At `lg+`: `grid-cols-4`.
- At `2xl+`: `grid-cols-6` (optional, only if the page has ≥ 6 stats).
- Reduce icon size and font sizes at `sm:` breakpoint inside `StatCard.tsx` so cards don't overflow on narrow screens.

### 2.3 Tables → mobile card lists

For every table in the app (residents caseload, recent donations, recordings, visits, users list, etc.):

- Keep the existing `<table>` inside `.table-container` for `md+` (hidden on `< md` with `hidden md:block`).
- Add a **mobile card list** that renders the same data as stacked cards for `< md` (`md:hidden`). Each card uses `SectionCard` or a simple `.card` div and shows the primary field (name) large, with secondary fields in a two-column grid below.
- Make sure filters/search bars also stack vertically on `< sm` (`flex-col sm:flex-row`).

### 2.4 Charts on mobile

- Reduce chart height at `< sm` via a responsive prop pattern: use `window.matchMedia` inside a small `useIsMobile()` hook (`components/admin/hooks/useIsMobile.ts`) that returns true below 640px. Pass `height={220}` on mobile vs `300` on desktop.
- For pie/donut charts, hide the legend on mobile or move it below the chart (`<Legend verticalAlign="bottom" />`).

### 2.5 Forms

- Every form input: `w-full`. Remove any fixed widths.
- Form field grids: `grid-cols-1 sm:grid-cols-2` instead of always 2 columns.
- Button rows: `flex-col sm:flex-row gap-2` on narrow screens.

### 2.6 Typography

- `PageHeader.tsx`: title should be `text-xl sm:text-2xl lg:text-3xl`, subtitle `text-sm sm:text-base`. Apply similar responsive bumps anywhere you see fixed large text (`text-3xl`, `text-4xl`).

### 2.7 Test at these breakpoints manually

- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad portrait)
- 1024px (iPad landscape)
- 1280px (small desktop)
- 1920px (standard desktop — full viewport goal)
- 2560px (ultrawide — verify content doesn't look absurdly stretched)

---

## Phase 3 — Shared Toast notification system

### 3.1 Create `components/admin/Toast.tsx` and `contexts/ToastContext.tsx`

- `ToastContext` exposes `showToast({ type: 'success' | 'error' | 'info', message: string, duration?: number })`.
- Provider renders a fixed container (`fixed top-4 right-4 z-50 flex flex-col gap-2`) with a list of active toasts.
- Each toast auto-dismisses after `duration` (default 4000ms), and has a close button.
- Styling: use existing CSS vars.
  - success: `bg-[var(--color-surface-container-lowest)] border-l-4 border-[var(--color-primary)] text-[var(--color-on-surface)]`
  - error: same but `border-[var(--color-error)]`
  - info: `border-[var(--color-outline-variant)]`
- Include a checkmark icon for success, X icon for error (use existing icon library already in the project — check for `lucide-react` imports in existing files; do not add a new dependency).
- Animate in/out with Tailwind `transition-transform` + `translate-x-full → translate-x-0`.

### 3.2 Wire the provider in `App.tsx`

- Wrap the entire app inside `<ToastProvider>` (just inside `<AuthProvider>`).
- Export a `useToast()` hook.

### 3.3 Fire toasts from forms

- In every form submit handler, after a successful `POST`, call `showToast({ type: 'success', message: 'Process recording saved successfully.' })` (and equivalents for home visits, resident intake, etc.).
- On failure, call `showToast({ type: 'error', message: 'Failed to save recording. Please try again.' })`.
- Keep the existing inline error states for validation feedback — toasts are for save-success and network-level errors only.

---

## Phase 4 — Wizard-style Process Recording & Home Visitation forms

### 4.1 Create shared wizard primitives (`components/admin/wizard/`)

- `Stepper.tsx` — renders the step indicator at the top: a horizontal bar with numbered circles, the current step highlighted with `var(--color-primary)`, completed steps with a checkmark, upcoming steps muted. Labels below each circle on `sm+`, hidden on `< sm`.
- `ProgressBar.tsx` — a simple `<div>` with a filled inner `<div>` whose width is `((currentStep) / totalSteps) * 100%`, animated with `transition-all duration-300`. Sits directly above or below the Stepper.
- `WizardShell.tsx` — layout wrapper that takes `title`, `currentStep`, `totalSteps`, `stepLabels`, `children` (the current step's form fields), `onNext`, `onBack`, `onSubmit`, `canAdvance` (bool), `isSubmitting` (bool). Renders the stepper, progress bar, the step body inside a `SectionCard`, and a footer row with Back / Next (or Submit on last step) buttons.
- Back button is disabled on step 1. Next is disabled when `canAdvance === false`.

### 4.2 Refactor `StaffProcessRecording.tsx` (and mirror into admin's `ProcessRecording.tsx`)

Break the form into four steps. Keep the existing field names and the existing POST payload shape — only the UI changes.

**Step 1 — Basics**
- Resident dropdown
- Session date
- Session duration / location (if present)
- Social worker name (prefilled, read-only)

**Step 2 — Observations**
- Emotional state observed
- Narrative summary

**Step 3 — Interventions & Follow-up**
- Interventions applied
- Follow-up actions
- Concerns flagged (checkbox)

**Step 4 — Review & Submit**
- Read-only summary of all entered fields, grouped by section with an "Edit" link next to each group that jumps back to that step.
- Submit button (primary, full width on mobile). Shows `isSubmitting` spinner state while the POST is in flight.
- On success: fire success toast, reset form state, return to Step 1, and refresh the "My Recordings" history panel on the right.
- On failure: fire error toast, keep the user on Step 4.

**Validation per step** (client-side, gates the Next button):
- Step 1: Resident and session date are required.
- Step 2: Narrative summary is required (min 10 chars).
- Step 3: No required fields — user can skip forward.
- Step 4: No input — just submit.

Store wizard state in a single `useState` object at the top of the page component. Do NOT introduce `react-hook-form` or any new dependency.

**Layout**: Keep the existing two-column layout (wizard left, "My Recordings" history right) on `lg+`. On `< lg`, stack them — wizard first, history below.

### 4.3 Refactor `StaffHomeVisits.tsx` (and mirror into admin's `HomeVisits.tsx`)

Same 4-step pattern, adapted to home visit fields:

**Step 1 — Basics**
- Resident dropdown
- Visit date
- Visit type

**Step 2 — Observations**
- Family cooperation level
- Observations / notes narrative

**Step 3 — Safety & Follow-up**
- Safety concerns flagged (checkbox)
- Follow-up needed (checkbox)
- Follow-up notes

**Step 4 — Review & Submit**
- Same pattern as recording.

Keep the existing tab layout (Log a Visit | My Visit History | Case Conferences) — the wizard replaces the form inside the first tab only.

### 4.4 Admin versions

The admin-route forms (`pages/(admin)/dashboard/process-recording/ProcessRecording.tsx` and `.../home-visitation/HomeVisits.tsx`) are described in CLAUDE.md as "unstyled, admin-route only." Apply the same wizard refactor to them so admins get the same experience. Share the wizard shell and step bodies — do not duplicate field logic. Extract the step components into `components/admin/wizard/recording/` and `.../visit/` and import from both the admin and staff pages.

---

## Phase 5 — Verification checklist

Run through this checklist before declaring done. Do NOT skip any item.

### 5.1 Build & lint
- `npm run build` (or equivalent) in `frontend/` — must pass with zero TypeScript errors.
- `npm run lint` if configured — must pass.

### 5.2 Visual / manual QA at each breakpoint
For each of: `/admin/dashboard`, `/admin/residents`, `/admin/donors`, `/admin/social`, `/admin/ml`, `/admin/users`, `/admin/safehouses`, `/admin/dashboard/process-recording`, `/admin/dashboard/home-visits`, `/staff/dashboard`, `/staff/residents`, `/staff/process-recording`, `/staff/home-visits`, `/staff/ml`:

- At 375px: sidebar hidden, hamburger works, content doesn't overflow horizontally (no horizontal scroll on `<body>`).
- At 768px: layout adapts, tables still readable.
- At 1280px: content uses full width, no awkward large gaps.
- At 1920px: dashboards truly fill the viewport with no dead space.
- At 2560px: content still looks reasonable (no absurd empty sides).

Check with browser devtools, and use the `mcp__Claude_in_Chrome__resize_window` + `mcp__Claude_in_Chrome__computer screenshot` tools to capture proof screenshots at 375px and 1920px for each page. Save screenshots under `/sessions/happy-awesome-feynman/ui-refresh-screenshots/` and list them in the final report.

### 5.3 Wizard flows
- Start a new Process Recording on `/staff/process-recording`.
- Click Next on step 1 without selecting a resident — verify Next is disabled.
- Fill required fields, advance through all 4 steps, verify progress bar fills.
- Click Back from step 3, verify previously entered data is preserved.
- On step 4, verify the summary shows exactly what was entered.
- Submit — verify success toast appears, form resets, history panel refreshes.
- Repeat the same flow for Home Visits and both admin-route equivalents.

### 5.4 Toast
- Trigger a failing submit (temporarily break the URL in dev tools or throttle offline) and verify error toast appears in red.
- Verify toasts stack correctly when multiple fire at once.
- Verify auto-dismiss works after ~4s.
- Verify close button works.
- Verify toasts don't interfere with the hamburger button on mobile (z-index is correct).

### 5.5 Accessibility smoke test
- Tab through the wizard — all buttons and inputs should be reachable with keyboard.
- Step indicator should have `aria-current="step"` on the active step.
- Progress bar should have `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Toast container should have `role="status"` (success) or `role="alert"` (error).
- Hamburger button should have `aria-label="Toggle navigation"` and `aria-expanded`.

### 5.6 Regressions to actively check
- Existing admin features still work (Dashboard charts render, DonorsPage breakdown tables work, Residents search/filter works, UsersPage user management works).
- Existing staff features still work (caseload filter/search, inline expandable detail panel still opens).
- `authFetch` is still used everywhere — no new `fetch()` calls introduced.
- No raw hex colors introduced. Grep `#[0-9a-fA-F]{3,6}` inside `frontend/src/` after changes and verify all results are either pre-existing or inside CSS var definitions in `index.css`.
- No new dependencies in `package.json` unless strictly necessary. If something was added, justify it in the final report.

---

## Phase 6 — Final report

Produce a short markdown summary at `/sessions/happy-awesome-feynman/mnt/intex-w26/ui-refresh-report.md` containing:

- List of every file changed (grouped by phase).
- Any new files added under `components/admin/`.
- Screenshot paths for mobile + desktop of each major page.
- Any deviations from this plan and why.
- Anything still TODO or out of scope.

---

## Order of execution (recommended)

1. Phase 0 inventory → commit nothing yet, just gather info.
2. Phase 3 (Toast system) — cheap and unblocks Phase 4 success feedback.
3. Phase 4 (wizard forms) — largest self-contained chunk; do this before the global layout sweep so form pages are already in their final structure when you verify responsiveness.
4. Phase 1 (full-width) — global sweep; touches many files but each change is small.
5. Phase 2 (mobile responsiveness) — builds on Phase 1; do this last because mobile testing benefits from already having full-width working correctly.
6. Phase 5 verification.
7. Phase 6 report.

Commit after each phase with a clear message. Do not squash until the user reviews.
