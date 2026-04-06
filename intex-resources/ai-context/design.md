# Pag-asa Sanctuary Design System: design.md

## 1. Creative North Star: "The Serene Guardian"
Pag-asa Sanctuary is a digital sanctuary. The design philosophy balances **Institutional Trust** (reliability, security, professionalism) with **Safe Haven** (warmth, empathy, calm).

### Key Principles:
- **Protective & Professional:** The UI should feel like a sturdy, reliable structure that is also soft and welcoming.
- **Calm Clarity:** Avoid visual clutter. Use high whitespace and soft transitions to reduce cognitive load, especially for vulnerable populations.
- **Empowerment Through Action:** Buttons and CTAs should feel like invitations to grow or help, never like demands.

---

## 2. Visual Foundation

### Color Palette
- **Main Background:** Warm Cream (`#FEF9F3`) - used for all page backgrounds to avoid the clinical feel of pure white.
- **Primary Actions:** Muted Teal (`#2D9F8C`) - used for primary buttons, progress bars, and key branding elements. Represents growth and stability.
- **Accents/Notifications:** Soft Lavender (`#DB7981`) - used for priority alerts, high-impact stories, or subtle decorative elements. It's a "warm" alert color, avoiding harsh reds.
- **Secondary Surfaces:** Off-white/Soft Sand (`#F8F3EB`) - used for card backgrounds or section separation.
- **Typography/Text:** Deep Charcoal/Slate (`#1E293B`) - for high-contrast, legible body text.

### Typography
- **Headings:** **Quicksand** (Bold/Semi-bold). Rounded terminals feel friendly and approachable.
- **Body Text:** **Inter** (Regular/Medium). Highly legible, professional, and clean.
- **Scales:**
  - H1: 32px - 48px (Hero/Welcome)
  - H2: 24px - 32px (Section headers)
  - Body: 14px - 16px
  - Small/Caption: 12px

---

## 3. UI Components & Style

### Cards & Containers
- **Border Radius:** `24px` on all primary cards and large containers.
- **Shadows:** Soft `10%` opacity shadows (e.g., `0 4px 20px rgba(0,0,0,0.05)`).
- **Glassmorphism:** Use `backdrop-blur-md` and semi-transparent backgrounds (e.g., `white/80`) for fixed headers, overlays, and modals to create depth without heaviness.

### Navigation
- **Mobile:** Bottom Navigation with large, centered active states.
- **Desktop (Staff):** Fixed left sidebar (`w-72`) with clear, icon-based navigation.
- **Desktop (Public):** Top navigation with a clear 'Donate' or 'Quick Exit' primary action.

### Interactions
- **Buttons:** Fully rounded (pill-shaped) for a softer look. Subtle scale-up or opacity-shift on hover.
- **Transitions:** Use `300ms ease-in-out` for all state changes (hovers, transitions) to maintain a "calm" rhythm.

---

## 4. Imagery & Content Tone
- **Imagery:** Warm, natural lighting. Soft focus backgrounds. Authentic, uplifting photography of nature or peaceful human interaction. Avoid "stock-photo" sterility.
- **Tone of Voice:** Empathetic, clear, and supportive. Use "We" and "You" to build connection.

---

## 5. Application Across User Types
- **Resident View:** Focus on simplicity, large touch targets, and emotional check-ins.
- **Admin View:** Focus on data clarity and efficiency, but use the same soft aesthetics so staff don't feel "clinical."
- **Donor View:** Focus on storytelling and "impact transparency." Use high-contrast teal for CTAs to drive action.

---

## 6. Implementation Reference (for AI agents and developers)

> This section documents how the design system is implemented in code. Do not change the design decisions above — only add to this section.

### CSS Variables (`frontend/src/index.css`)

All design tokens are CSS custom properties on `:root`. Use these variables — never hardcode hex values.

| Variable | Value | Usage |
|---|---|---|
| `--accent` | `#2D9F8C` | Primary buttons, links, progress bars, chart primary color |
| `--accent-light` | `#3db5a3` | Hover state for accent elements |
| `--accent-dark` | `#1f7a69` | Active/pressed states; gradient end color |
| `--accent-bg` | `rgba(45,159,140,0.10)` | Teal tint backgrounds (e.g., active nav item) |
| `--accent-border` | `rgba(45,159,140,0.30)` | Teal-tinted borders on hover |
| `--alert` | `#DB7981` | Warm rose/lavender for alerts, errors, critical risk — **never use harsh red** |
| `--alert-bg` | `rgba(219,121,129,0.10)` | Alert tint background |
| `--alert-border` | `rgba(219,121,129,0.30)` | Alert-tinted border |
| `--bg` | `#FEF9F3` | Warm Cream — every page background |
| `--bg-alt` | `#F8F3EB` | Soft Sand — section separators, sidebar, table headers |
| `--card-bg` | `rgba(248,243,235,0.90)` | Semi-transparent card background |
| `--text` | `#78726A` | Body/secondary text |
| `--text-h` | `#1E293B` | Headings, labels, primary text |
| `--border` | `#E8E0D0` | Warm-toned borders throughout |
| `--shadow` | `0 4px 20px rgba(0,0,0,0.05)` | Card and component shadows |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.08)` | Elevated modals or floating elements |
| `--sans` | `'Inter', system-ui` | Body font family |
| `--heading` | `'Quicksand', system-ui` | Heading font family (bold, rounded terminals) |

### Typography in Tailwind / JSX

- Apply heading font via `font-[family-name:var(--heading)]` on brand name spans, section titles, or `<h1>`–`<h4>` (already set globally in CSS).
- Apply body font via `font-[family-name:var(--sans)]` anywhere you need to explicitly override.
- Google Fonts loaded in `frontend/index.html`: **Quicksand** (600, 700) + **Inter** (400, 500, 600).

### Key Component Rules

| Component | Rule |
|---|---|
| `.card` | `border-radius: 24px` — set in CSS, applies everywhere `.card` is used |
| `.btn` | `border-radius: 9999px` (pill) — set in CSS, applies to all `.btn-*` variants |
| `.table-container` | `border-radius: 16px` — slightly smaller than cards |
| `.form-group input/select/textarea` | `border-radius: 12px` |
| Transitions | Always `300ms ease-in-out` — never use `duration-200` or `0.2s` |
| Header (public) | Glassmorphism: `bg-[var(--bg)]/80 backdrop-blur-md` |
| Admin sidebar | `w-72` (288px) on desktop, collapses to `w-0` on toggle |

### Color Usage Rules

- **Never use `text-red-*` or `bg-red-*`** for user-facing states. Use `text-[#DB7981]` / `bg-[#DB7981]/10` (or `var(--alert)` / `var(--alert-bg)`) instead.
- **Risk level colors:** Low → `#22c55e`, Medium → `#d97706`, High → `#f97316`, Critical → `#DB7981`
- **Chart primary line/bar:** `#2D9F8C` (accent). Secondary series: `#3db5a3`, `#5eead4`, `#99f6e4`.
- **CTA section gradient:** `linear-gradient(135deg, #2D9F8C 0%, #1f7a69 100%)` — teal to deep teal.
- Dark mode is **disabled** — `color-scheme: light` only.

### File Locations

| What | Where |
|---|---|
| Global CSS / design tokens | `frontend/src/index.css` |
| Google Fonts + page title | `frontend/index.html` |
| Reusable admin stat card | `frontend/src/components/admin/AdminStatCard.tsx` |
| Admin shell (sidebar + topbar) | `frontend/src/pages/(admin)/AdminLayout.tsx` |
| Public landing page | `frontend/src/pages/Landing.tsx` |
| Public header | `frontend/src/components/Header.tsx` |