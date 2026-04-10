# UI Improvements Plan — Pag-asa Sanctuary

> Hand this document to another agent. It assumes the agent has already read
> `CLAUDE.md` at the repo root. All conventions there apply (CSS vars only,
> `authFetch`, shared `components/admin/*` primitives, etc.).

## Scope overview

Four related changes, applied to both the **admin** (`/admin/*`) and **staff** (`/staff/*`) portals:

1. Widen every dashboard/list page from its current `max-w-[1200px]` cap to a **1600px cap**, centered, while preserving current styling.
2. Make every one of those pages fully **responsive down to mobile** (min 360px).
3. Convert the four **Process Recording** and **Home Visitation** forms into a **step-by-step wizard** with a progress bar.
4. Show a **toast** on successful save (and on error) for every form submission.

The wizard/toast changes also apply to the admin versions of those two forms (`/admin/dashboard/process-recording` and `/admin/dashboard/home-visitation`), which currently exist but are unstyled.

## Files you will touch

### Frontend (all under `frontend/src/`)

Layouts and pages to widen + make responsive (everything *except* the four forms):

```
pages/(admin)/AdminLayout.tsx
pages/(admin)/dashboard/Dashboard.tsx
pages/(admin)/donors/DonorsPage.tsx
pages/(admin)/residents/Residents.tsx
pages/(admin)/social/SocialPage.tsx
pages/(admin)/ml/MLPage.tsx
pages/(admin)/users/UsersPage.tsx
pages/(admin)/safehouses/*.tsx
pages/(staff)/StaffLayout.tsx
(Dashboard.tsx and Residents.tsx are shared — one file, branched via isAdmin)
```

Forms to rewrite as wizards:

```
pages/(staff)/process-recording/StaffProcessRecording.tsx
pages/(staff)/home-visits/StaffHomeVisits.tsx
pages/(admin)/dashboard/process-recording/ProcessRecording.tsx
pages/(admin)/dashboard/home-visitation/HomeVisits.tsx
```

New files to create:

```
components/admin/Toast.tsx          ← toast provider + useToast hook
components/admin/FormWizard.tsx     ← generic wizard shell with progress bar
components/admin/ProgressBar.tsx    ← standalone progress bar (used by FormWizard)
```

No backend changes are required. The existing `POST /api/staff/process-recordings` and `POST /api/staff/home-visits` endpoints already return success/error responses that the new toasts will consume.

---

## Task 1 — Widen dashboards to 1600px

Every page currently wraps its root in `<div className="flex flex-col gap-6 max-w-[1200px]">`. Replace the cap.

**Find-and-replace across every file listed above except the four forms:**

```
max-w-[1200px]   →   max-w-[1600px] mx-auto w-full
```

Add `mx-auto` so the content stays centered on very wide monitors, and `w-full` so it still fills the viewport below 1600px. The staff layout's `<main>` already has no width cap — leave that alone.

If any page uses a nested `max-w-[1200px]` (e.g., Residents.tsx has two occurrences around lines 392 and 786), apply the same replacement to each.

**Do not** touch:
- Form pages (they become wizards — Task 3 handles them).
- Login pages (they use `max-w-md` intentionally).
- Home/public pages under `pages/(home)/` (out of scope).
- Inline max-widths like `max-w-[280px]` inside table cells or `max-w-sm` inside unauthorized — those are content-level constraints, not page-level.

**Verification:**
- Resize browser to 1920px wide and confirm every page uses more real estate than before, with equal gutters on either side of the content.
- Resize to 1200px and confirm the layout looks identical to the current production view.

---

## Task 2 — Responsive down to mobile

The pages currently assume desktop. Audit each page and apply the following pattern.

### 2a. Grid stat cards

Find every usage of stat card grids. The common pattern today is a 4-column grid (`grid-cols-4`). Replace with:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

For 3-column grids use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Same approach for 2-column grids: `grid-cols-1 md:grid-cols-2`.

### 2b. Side-by-side chart + list layouts

Wherever the current layout has two columns using `grid-cols-2` (e.g., Dashboard's activity feed vs chart), wrap with:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

For the Residents inline detail panel (around line 1204), the panel is currently `w-[520px]`. On mobile it must slide over as a full-screen drawer:

```tsx
<div className="w-full lg:w-[520px] max-w-full bg-[var(--color-surface-container-lowest)] ...">
```

Also ensure the parent container supporting the drawer switches from `flex` to `block` under `lg:`.

### 2c. Tables

Every `.table-container` should already scroll horizontally, but verify by wrapping each table like this if not already:

```tsx
<div className="table-container overflow-x-auto">
  <table className="w-full min-w-[720px]"> ... </table>
</div>
```

Set `min-w-[720px]` (or larger for tables with many columns) so columns don't squish.

### 2d. Sidebar layouts (both layouts)

Both `AdminLayout.tsx` and `StaffLayout.tsx` use a persistent sidebar. On screens narrower than `md` (768px), the sidebar should become a drawer overlay rather than take sidebar width.

Apply to both layouts:

```tsx
// sidebar classes:
`${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'}
 fixed md:sticky top-0 left-0 z-40 h-screen
 bg-[var(--color-surface-container-lowest)]
 border-r border-[var(--color-outline-variant)]
 flex flex-col overflow-hidden
 transition-all duration-[300ms] ease-in-out`
```

When the sidebar is open on mobile, render a backdrop:

```tsx
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-30 md:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

On `md+` the sidebar stays sticky as it is today; on mobile it overlays.

The top bar stays — the hamburger already toggles `sidebarOpen`, so no JS change needed.

Also shrink the `<main>` horizontal padding on mobile:
```tsx
<main className="flex-1 overflow-y-auto p-4 sm:p-6">
```

### 2e. Header / ProfileCard

The header has `px-6 py-3 flex items-center justify-between`. On very narrow screens the `<ProfileCard />` may overflow. Add `min-w-0` to its wrapper and ensure the profile card itself truncates long names with `truncate max-w-[160px] sm:max-w-none`.

### 2f. Breadcrumbs bar

`px-6 py-2` → `px-4 sm:px-6 py-2` and allow the breadcrumbs row to wrap:

```tsx
<div className="... flex flex-wrap gap-x-2">
```

**Verification:**
- DevTools device toolbar at 375px (iPhone), 768px (iPad), 1024px, 1440px, 1920px.
- At each size: no horizontal scrollbar on the `<body>`; sidebar correctly either sticks or overlays; all stat grids collapse to 1–2 columns on narrow screens; tables scroll horizontally inside their container.

---

## Task 3 — Step-by-step wizards with progress bar

### 3a. Build shared wizard primitives

Create `components/admin/ProgressBar.tsx`:

```tsx
interface ProgressBarProps {
  currentStep: number    // 1-indexed
  totalSteps: number
  stepLabels?: string[]  // optional; shown below the bar
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  const percent = (currentStep / totalSteps) * 100
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--color-on-surface)]">
          Step {currentStep} of {totalSteps}
          {stepLabels && `: ${stepLabels[currentStep - 1]}`}
        </span>
        <span className="text-sm text-[var(--color-on-surface-variant)]">
          {Math.round(percent)}%
        </span>
      </div>
      <div className="w-full h-2 bg-[var(--color-surface-container-low)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
```

Create `components/admin/FormWizard.tsx`. It renders the progress bar, the current step's children, and Back/Next/Submit controls. Keep it presentation-only — form state lives in the parent.

```tsx
import { ReactNode } from 'react'
import { ProgressBar } from './ProgressBar'

export interface WizardStep {
  label: string
  /** Return true if the step's data is valid and user may advance */
  isValid: () => boolean
  content: ReactNode
}

interface FormWizardProps {
  steps: WizardStep[]
  currentStep: number                  // 1-indexed
  onStepChange: (step: number) => void
  onSubmit: () => void | Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function FormWizard({
  steps, currentStep, onStepChange, onSubmit, isSubmitting, submitLabel = 'Submit'
}: FormWizardProps) {
  const isLast = currentStep === steps.length
  const current = steps[currentStep - 1]

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 bg-[var(--color-surface-container-lowest)] py-4 px-4 sm:px-6 border-b border-[var(--color-outline-variant)] rounded-t-xl">
        <ProgressBar
          currentStep={currentStep}
          totalSteps={steps.length}
          stepLabels={steps.map(s => s.label)}
        />
      </div>

      <div className="px-4 sm:px-6 pb-4">
        {current.content}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[var(--color-outline-variant)]">
        <button
          type="button"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 1 || isSubmitting}
          className="btn-secondary"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!current.isValid() || isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (current.isValid()) onStepChange(currentStep + 1)
            }}
            disabled={!current.isValid() || isSubmitting}
            className="btn-primary"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
```

The button classes `btn-primary` and `btn-secondary` may or may not already exist in the global CSS — check `frontend/src/index.css` (or wherever global styles live). If not, use inline Tailwind classes matching the existing button style used in the current form "Submit" buttons. Mirror whatever pattern is already in `StaffProcessRecording.tsx`.

### 3b. Step grouping (agent's discretion)

Use the following logical groupings. If any step's field doesn't exist in the current form, drop it; if the form has extra fields, place them in whichever step matches.

**Process Recording wizard (4 steps):**

1. **Resident & session** — resident dropdown, session date, social worker (auto-filled from `user.fullName`, read-only).
2. **Observations** — emotional state observed, narrative summary (multiline).
3. **Actions** — interventions applied, follow-up actions, concerns flagged checkbox.
4. **Review & submit** — read-only summary of steps 1–3 + Submit button.

**Home Visitation wizard (4 steps):**

1. **Resident & visit** — resident dropdown, visit date, visit type, social worker (auto-filled, read-only).
2. **Family & safety** — family cooperation level, safety concerns flagged.
3. **Follow-up** — follow-up needed, narrative/notes.
4. **Review & submit** — read-only summary of steps 1–3 + Submit button.

### 3c. Wiring the wizard into each form page

Each of the four form pages should be restructured like this (example is for `StaffProcessRecording.tsx`; apply the same shape to the other three):

```tsx
const [currentStep, setCurrentStep] = useState(1)
const [isSubmitting, setIsSubmitting] = useState(false)
const [form, setForm] = useState<ProcessRecordingForm>(initialForm)

// Keep existing data-fetching (residents list, history) in separate cards.
// The wizard only replaces the form card.

const steps: WizardStep[] = [
  {
    label: 'Resident & session',
    isValid: () => !!form.residentId && !!form.sessionDate,
    content: <StepResidentAndSession form={form} setForm={setForm} residents={residents} userName={user.fullName} />,
  },
  {
    label: 'Observations',
    isValid: () => form.emotionalState.length > 0 && form.narrativeSummary.trim().length > 0,
    content: <StepObservations form={form} setForm={setForm} />,
  },
  {
    label: 'Actions',
    isValid: () => form.interventionsApplied.trim().length > 0,
    content: <StepActions form={form} setForm={setForm} />,
  },
  {
    label: 'Review & submit',
    isValid: () => true,
    content: <StepReview form={form} residents={residents} />,
  },
]

const handleSubmit = async () => {
  setIsSubmitting(true)
  try {
    await createProcessRecording(form)
    toast.success('Process recording saved.')
    setForm(initialForm)
    setCurrentStep(1)
    refetchHistory()
  } catch (err) {
    toast.error('Failed to save recording. Please try again.')
  } finally {
    setIsSubmitting(false)
  }
}

return (
  <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
    <PageHeader title="Process Recording" subtitle="..." />
    <SectionCard title="New recording">
      <FormWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save recording"
      />
    </SectionCard>
    <SectionCard title="My recordings">
      {/* existing history list, paginated */}
    </SectionCard>
  </div>
)
```

Extract each step's markup into a small local subcomponent (`StepResidentAndSession`, `StepObservations`, etc.) inside the same file. This keeps the wizard steps legible without creating a new file explosion.

Keep the existing **"My recordings" / "My visit history" / case-conferences** sections on each page — those are not part of the wizard, they live below it.

For the two **admin-route** forms (`ProcessRecording.tsx` and `HomeVisits.tsx` under `pages/(admin)/dashboard/`): these are currently unstyled. After wizardifying them, also apply the standard page shell so they look like every other admin page: wrap in `<div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">`, add `<PageHeader>`, wrap the wizard in `<SectionCard>`.

### 3d. Mobile-friendliness of the wizard

Each step's content must reflow on mobile. For any field row using `grid grid-cols-2`, change to `grid grid-cols-1 md:grid-cols-2`. The wizard shell itself is already mobile-friendly because the progress bar is 100% width and the Back/Next buttons are in a simple flex row.

**Verification:**
- Navigate through all four wizards, filling in required fields only. Next button should be disabled until each step is valid.
- Try to skip a required field — Next stays disabled.
- Back retains previously-entered values (state lives in parent).
- On mobile (375px), the progress bar, step content, and Back/Next buttons all render without horizontal overflow.

---

## Task 4 — Success / error toasts

### 4a. Build the toast system

Create `components/admin/Toast.tsx`:

```tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; kind: ToastKind; message: string }

interface ToastContextValue {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, kind, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const value: ToastContextValue = {
    success: msg => push('success', msg),
    error: msg => push('error', msg),
    info: msg => push('info', msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              pointer-events-auto min-w-[260px] max-w-[400px]
              rounded-lg shadow-lg px-4 py-3 text-sm
              border
              ${t.kind === 'success'
                ? 'bg-[var(--color-surface-container-lowest)] border-[var(--color-primary)] text-[var(--color-on-surface)]'
                : ''}
              ${t.kind === 'error'
                ? 'bg-[var(--color-error-container)] border-[var(--color-error)] text-[var(--color-error)]'
                : ''}
              ${t.kind === 'info'
                ? 'bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] text-[var(--color-on-surface)]'
                : ''}
            `}
          >
            <div className="flex items-start gap-2">
              <span aria-hidden>
                {t.kind === 'success' ? '✓' : t.kind === 'error' ? '⚠' : 'ℹ'}
              </span>
              <span className="flex-1">{t.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
```

### 4b. Wire the provider in once

In `frontend/src/App.tsx`, wrap the router tree in `<ToastProvider>`. It must sit *inside* `<AuthProvider>` so any authenticated component can call `useToast()`.

```tsx
<AuthProvider>
  <ToastProvider>
    <BrowserRouter>
      <Routes> ... </Routes>
    </BrowserRouter>
  </ToastProvider>
</AuthProvider>
```

### 4c. Use toasts in every form submit

In each of the four wizard pages, call `const toast = useToast()` at the top of the component and use `toast.success('...')` / `toast.error('...')` as shown in Task 3c's `handleSubmit`.

Messages to use (keep consistent):
- Process Recording success: `'Process recording saved.'`
- Process Recording failure: `'Failed to save recording. Please try again.'`
- Home Visitation success: `'Home visit logged.'`
- Home Visitation failure: `'Failed to save home visit. Please try again.'`

### 4d. Post-submit behavior (form reset)

On success, reset the form state to `initialForm` and set `setCurrentStep(1)` so the wizard is ready for the next entry. Also call the existing `refetch` for "My recordings" / "My visit history" so the new entry appears below immediately.

**Verification:**
- Submit a valid recording → green toast appears for ~4 seconds, form resets to step 1, new entry visible in history below.
- Submit with the backend deliberately failing (e.g., bad auth) → red error toast, form stays on step 4 with entered data so the user can retry.
- On mobile (375px), toast is positioned inside the viewport and doesn't clip.

---

## Execution order (suggested)

1. **Task 1** (widen to 1600px) — smallest change, lowest risk, unblocks nothing else. Ship first.
2. **Task 2** (responsive) — independent from the wizard work but touches the same files as Task 1, so batch with Task 1 if convenient.
3. **Task 4a + 4b** (toast primitives + provider) — must exist before Task 3 can reference `useToast`.
4. **Task 3** (wizard) — the biggest change, depends on Task 4a.
5. **Task 4c + 4d** (wire toasts into each wizard) — trivial once Task 3 is done.

After each task, run the verification checklist in that task's section before moving on.

---

## Things NOT to do (from CLAUDE.md, restated for emphasis)

- Do not use raw hex colors or Tailwind color classes — only `var(--color-*)`.
- Do not call `fetch` directly — all API calls go through `authFetch` / the typed helpers in `src/lib/staffApi.ts` and `src/lib/adminApi.ts`.
- Do not introduce a third-party toast library (`react-hot-toast`, etc.) — build it with the CSS vars so it matches the rest of the design system.
- Do not change any backend code for these tasks.
- Do not touch the public home pages under `pages/(home)/`.
- Do not trust `safehouseId` from the client anywhere — server already derives it, don't add client-side overrides.
- Do not add the widening/responsive changes to the login pages (they intentionally stay narrow).

---

## Final verification pass

After all four tasks are complete, do one end-to-end smoke test as both roles:

1. Log in as a **staff** user.
2. Visit `/staff/dashboard`, `/staff/residents`, `/staff/ml` at 375px, 768px, 1440px, and 1920px. No horizontal scroll on body; layouts reflow cleanly; sidebar overlays on mobile.
3. Visit `/staff/process-recording`. Complete the wizard end-to-end, submit, see green toast, confirm the new entry appears in the history list.
4. Visit `/staff/home-visits`. Same drill.
5. Log out, log in as **admin**.
6. Repeat the resize check on `/admin/dashboard`, `/admin/donors`, `/admin/residents`, `/admin/social`, `/admin/ml`, `/admin/users`, `/admin/safehouses`.
7. Visit `/admin/dashboard/process-recording` and `/admin/dashboard/home-visitation`. Confirm they now have the standard page shell + wizard + toast, matching the staff versions in look and feel.

Ship when all checks pass.
