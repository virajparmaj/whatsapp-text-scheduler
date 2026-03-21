# 02 — Design System

## Purpose
Capture the current visual/design language as implemented, since no standalone design system package exists.

## Status
- **Confirmed from code** for component primitives, tokens, and interaction patterns.
- No formal design-token documentation or design governance file found.

## Confirmed from code

### Visual aesthetic
- Desktop productivity layout with left sidebar + right content pane (`src/App.tsx`).
- Clean light-first UI with WhatsApp-adjacent green as primary accent (`src/index.css`).

### Color usage
- CSS variable token set defined in `:root` and consumed by Tailwind semantic classes (`src/index.css`, `tailwind.config.ts`).
- Primary color token: `--primary: 142 71% 45%`.
- Status-specific semantic colors for badges/toasts (success, warning, info, destructive) in UI components.

### Typography
- System font stack in global CSS (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`).
- Utility-based size/weight usage (`text-xs` to `text-xl`, `font-medium`, `font-semibold`) across pages/components.

### Spacing, cards, radius, shadow
- Global radius token `--radius: 0.5rem`, reused via Tailwind extension.
- Consistent bordered card/list style (`rounded-lg border bg-card p-*`).
- Shared hover utility `.card-hover` for lift/shadow micro-interactions.

### Interaction style
- Button variants and sizes centralized in `ui/button.tsx`.
- Form primitives use shared `Input`, `Select`, `Textarea`, `Switch`, `Label` wrappers.
- Dialog interactions via custom modal component in `ui/dialog.tsx`.
- Toast feedback for key actions via `ui/toast.tsx`.

### Motion/animation
- Tailwind keyframes: `slide-in-right` and `fade-in` (`tailwind.config.ts`).
- Used in toasts and popovers/modals.

## Inferred / proposed
- **Strongly inferred** goal is pragmatic consistency over brand-heavy visual identity.
- **Strongly inferred** pattern source is “shadcn-style primitives adapted locally,” not full Radix/shadcn package install.

## Important details
- `darkMode: 'class'` exists in Tailwind config, but dark token overrides are not defined in `src/index.css`.
- Body top padding reserves space for macOS hiddenInset traffic lights.
- Sidebar width and spacing are fixed constants (`w-52`, `p-6` content areas), creating stable desktop proportions.

## Open issues / gaps
- Design system is implicit in code, not documented as reusable token/component governance.
- Dark mode is effectively incomplete.
- Some primitives differ from canonical shadcn behavior (custom `select`, custom `switch`, custom dialog implementation).

## Recommended next steps
1. Add explicit dark token set or remove dark mode declaration until implemented.
2. Create lightweight design tokens reference (colors, spacing, radius, motion) and keep it versioned.
3. Standardize component accessibility semantics for custom primitives where needed.
