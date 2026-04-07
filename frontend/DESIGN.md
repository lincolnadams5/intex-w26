# Lighthouse Haven Design System: DESIGN.md

## 1. Creative North Star: "The Serene Guardian"
Lighthouse Haven is a digital sanctuary. The design philosophy balances **Institutional Trust** (reliability, security, professionalism) with **Safe Haven** (warmth, empathy, calm). 

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