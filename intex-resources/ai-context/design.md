# Pag-asa Sanctuary Design System: design.md

# Design System Document: The Anchored Horizon

## 1. Overview & Creative North Star: "The Digital Monolith"
This design system is built upon the concept of **"The Anchored Horizon."** It moves away from the flighty, ephemeral nature of modern SaaS and instead leans into a "Digital Monolith" aesthetic—an experience that feels architectural, permanent, and deeply rooted.

The system breaks the "template" look by favoring **intentional asymmetry** and **editorial density**. Instead of centering everything, we align elements to a strong vertical axis (the anchor) while allowing content to bleed or stagger horizontally (the horizon). We use high-contrast typography scales and overlapping layers to create a sense of three-dimensional space that feels like a high-end physical publication rather than a flat web page.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is a sophisticated interplay between the ocean-deep Teal and the radiant Warm Gold. We treat color as a structural element rather than a decorative one.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. Use `surface-container-low` sections sitting on `surface` backgrounds to create distinction. This forces a softer, more premium transition that feels "built" rather than "drawn."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of fine, heavy-stock paper.
- **Base Layer:** `surface` (#faf9f6) for the overall canvas.
- **Nesting:** To highlight a specific module, use `surface-container` or `surface-container-high`. The shift is subtle, signaling importance through tonal weight rather than visual noise.

### The "Glass & Signature Texture" Rule
To elevate the "Anchored Horizon" feel:
- **Floating Elements:** Use Glassmorphism for navigation bars or floating action menus. Utilize `surface` at 80% opacity with a `20px` backdrop-blur.
- **Signature Gradients:** For Hero sections or Primary CTAs, use a linear gradient from `primary` (#004c5a) to `primary-container` (#006677) at a 135-degree angle. This provides a "soul" to the deep teal, preventing it from appearing flat or clinical.

---

## 3. Typography: The Editorial Authority
The juxtaposition of a sturdy Serif and a high-performance Sans-Serif creates an immediate sense of established trust.

- **Display & Headlines (Noto Serif):** These are your "Anchor" points. Use `display-lg` and `headline-lg` with generous leading (1.2). Do not be afraid of large-scale typography; let the headlines own the white space.
- **Body & Labels (Manrope):** This is your "Horizon." Manrope’s geometric clarity provides a modern counterweight to the serif. Use `body-lg` for long-form reading to ensure the experience feels premium and accessible.
- **Tonal Hierarchy:** Headlines should always utilize `on-surface` (#1a1c1a), while supporting body text can drop to `on-surface-variant` (#3f484b) to create a clear visual path for the eye.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "digital." We achieve depth through atmospheric perspective.

- **The Layering Principle:** Stacking tiers (e.g., a `surface-container-lowest` card on a `surface-container-low` section) creates a "natural lift."
- **Ambient Shadows:** If a card must float, use a "Sky Shadow": `box-shadow: 0 12px 40px rgba(0, 76, 90, 0.06);`. Note the tint—we use a fraction of the `primary` color (Deep Teal) in the shadow to mimic natural light passing through an environment, rather than a generic grey.
- **The "Ghost Border" Fallback:** If a container requires a border for accessibility (e.g., on a white background), use a "Ghost Border": `outline-variant` (#bec8cb) at 20% opacity. **Never use 100% opaque borders.**

---

## 5. Components: Architectural Primitives

### Buttons
- **Primary:** `primary` background with `on-primary` text. Use the `lg` (8px) corner radius. For a "High-End" feel, add a subtle 1px inset top-light using `primary-fixed`.
- **Secondary:** Use the `secondary_container` (Warm Gold) with `on-secondary-container`. This acts as a "Beacon" in the UI.
- **States:** On hover, do not just darken the color; shift the elevation using a subtle ambient shadow.

### Input Fields
- **Styling:** No bottom line or full border. Use a `surface-container-high` background with an 8px top-radius.
- **Focus:** Transition the background to `surface-container-highest` and add a 2px "Ghost Border" of `primary`.

### Cards & Lists
- **The Divider Ban:** Strictly forbid the use of horizontal rules (`
`). Separate list items using `16px` or `24px` of vertical white space or alternating backgrounds between `surface` and `surface-container-low`.

- **Editorial Cards:** For news or data, use asymmetrical padding (e.g., `pt-32 pr-24 pb-24 pl-40`) to create an intentional, non-grid-bound aesthetic.

### Additional Signature Component: The "Horizon Line"
A decorative element consisting of a 2px thick line using the `secondary` (Warm Gold) token that spans 20% of the container width, placed above `headline-sm` elements to "anchor" the section.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use "Breathing Room." If you think there is enough margin, add 16px more.
- **Do** overlap elements. Let an image from one section slightly bleed into the `surface-container` of the next to create a cohesive narrative flow.
- **Do** use Warm Gold (`secondary`) sparingly. It is a highlighter, not a primary fill.

### Don't:
- **Don't** use standard "Grey" shadows. They muddy the Teal/Gold palette.
- **Don't** use 1px solid borders. It shatters the "Digital Monolith" illusion.
- **Don't** center-align long-form text. Keep it left-aligned to the "Anchor" axis to maintain authority.
- **Don't** use pure black (#000000). Always use `on-surface` (#1a1c1a) to maintain the soft editorial feel.