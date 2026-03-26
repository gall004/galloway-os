---
trigger: glob
globs: src/client/**/*.html, src/client/**/*.css, src/client/**/*.js
description: UI Design Standards & Responsiveness
---

## 1. Responsive Design
* **Rule:** The Kanban interface must be fully usable on desktop screens (≥1024px). Mobile is secondary but must not be broken.
* **Enforcement:** Never use hardcoded pixel widths that break layouts. Use fluid containers, `max-width`, flexbox, and CSS Grid for layout. Test at 1024px, 1440px, and 1920px viewports.

## 2. Design Tokens & Consistency
* **Rule:** All colors, spacing, typography, and border-radius values must be defined as CSS custom properties (design tokens) in a central stylesheet.
* **Enforcement:** Use `var(--token-name)` throughout — never hardcode raw hex/rgb values inline. This ensures a single source of truth for theming and future dark mode support.

## 3. Modern Typography
* **Rule:** Use a professional font stack loaded from Google Fonts (e.g., Inter, Outfit, or Roboto).
* **Enforcement:** Never rely on browser defaults. Load fonts in `<head>` and set them as the base `font-family` on `body`.

## 4. Micro-Animations & Transitions
* **Rule:** Interactive elements (buttons, cards, drag targets) must have subtle hover/transition effects to feel responsive and premium.
* **Enforcement:** Use CSS `transition` for hover states. Drag-and-drop interactions must provide visual feedback (shadow, scale, opacity changes). Avoid jarring state changes.

## 5. Accessibility Baseline
* **Rule:** All interactive elements must be keyboard-navigable and have appropriate ARIA attributes where semantic HTML is insufficient.
* **Enforcement:** Buttons must have descriptive labels. Color contrast must meet WCAG AA minimum (4.5:1 for normal text). Focus states must be visible.

## 6. No Alert Boxes
* **Rule:** Never use `window.alert()`, `window.confirm()`, or `window.prompt()` for user-facing messaging.
* **Enforcement:** Use in-app toast notifications or modal dialogs styled consistently with the design system.

## 7. Error Boundaries
* **Rule:** If a critical API call fails rendering the page useless, the UI must show a professionally styled fallback with a clear "Try Again" option.
* **Enforcement:** Never display raw error messages or stack traces to the user. Catch fetch errors and present user-friendly recovery UI.
