---
trigger: glob
globs: src/client/**/*.tsx, src/client/**/*.ts, src/client/**/*.jsx, src/client/**/*.js, src/client/**/*.css
description: UI Design Standards, ShadCN Mandate & Responsiveness
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

## 8. The ShadCN Mandate
* **Rule:** The frontend stack is **React + Tailwind CSS (v4) + ShadCN**. You MUST use ShadCN components by default. Do NOT build custom UI primitives (e.g., Buttons, Cards, Dialogs, Inputs, Dropdowns) from scratch if a ShadCN equivalent exists. All styling must use Tailwind utility classes.
* **Enforcement:**
  * Always prefer ShadCN UI components over native HTML elements or hand-rolled alternatives (e.g., use `<Button>` not `<button>`, `<Card>` not a custom `div` wrapper, `<Input>` not `<input>`).
  * If a required ShadCN component is not installed, install it via `npx shadcn@latest add <component>` before proceeding.
  * Do NOT use inline `style` attributes. All styling must flow through Tailwind utility classes or CSS custom properties defined in the design system.
  * Custom components are permitted ONLY for domain-specific patterns with no ShadCN equivalent (e.g., a Kanban column, a drag handle).

## 9. Semantic Color Mandate
* **Rule:** ALL colors must use Tailwind CSS semantic tokens (e.g., `bg-primary`, `text-destructive`, `border-border`, `text-muted-foreground`) or CSS custom properties defined in `index.css`. Absolutely NO hardcoded Tailwind color utilities (e.g., `bg-red-500`, `text-blue-600`, `border-slate-300`) are allowed.
* **Enforcement:**
  * Use only semantic color classes: `primary`, `secondary`, `muted`, `accent`, `destructive`, `foreground`, `background`, `card`, `popover`, `border`, `input`, `ring`, and any custom tokens defined under `:root` / `.dark` in `index.css`.
  * If a new semantic color is needed (e.g., for priority badges), define it as a CSS custom property in `index.css` under both `:root` and `.dark`, then register it in the `@theme` block.
  * During code review, any hardcoded Tailwind color class is an automatic rejection.

## 10. Mandatory Notifications
* **Rule:** ALL successful mutations (Create, Update, Delete) and ALL errors MUST trigger a UI notification using ShadCN's Sonner (toast) component.
* **Enforcement:**
  * On success: `toast.success("Task created")` or equivalent descriptive message.
  * On error: `toast.error("Failed to create task")` with the error message.
  * No silent failures or silent successes are permitted. The user must always know the outcome of their action.

## 11. Critical Action Confirmations
* **Rule:** ALL destructive actions (e.g., Delete) MUST be gated by a ShadCN `AlertDialog` requiring explicit user confirmation before execution.
* **Enforcement:**
  * The AlertDialog must clearly state what will be destroyed (e.g., "Delete task: {title}?").
  * The confirm button must use destructive styling (`variant="destructive"`).
  * Never delete a record on a single click without confirmation.

## 12. Form & Dialog Anatomy
* **Rule:** All forms MUST use the complete ShadCN anatomy: `<FormLabel>`, `<FormControl>`, `<FormDescription>` (help text), and `<FormMessage>`. Inputs must never stretch uncomfortably wide; use responsive `max-width`s or CSS grids with proper gaps (`gap-6`). All Modals MUST use `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>`, and `<DialogFooter>`.
* **Enforcement:**
  * Every form field must have a visible `<FormLabel>` and relevant `<FormDescription>` for complex or non-obvious inputs.
  * All form inputs must include descriptive `placeholder` text.
  * Dialogs must set a constrained `max-width` (e.g., `sm:max-w-[600px]` for task forms, `sm:max-w-[425px]` for config forms).
  * The primary action button must live inside `<DialogFooter>` with proper padding.
