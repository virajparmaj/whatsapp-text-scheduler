# 02 — Design System

## Status

No formal design system file exists. Design language is inferred from `src/index.css`, `tailwind.config.ts`, and component usage. Confirmed from code.

## Visual Aesthetic

Clean, macOS-native-feeling productivity tool. Sidebar + content layout. Minimal chrome. Green accent colour matches WhatsApp brand association.

## Colour Usage

Defined as CSS custom properties in `src/index.css` (`@layer base`), referenced via Tailwind utility classes.

| Token | HSL Value | Usage |
|---|---|---|
| `--primary` | 142 71% 45% | Active tab border, action buttons, success badges, switches |
| `--primary-foreground` | 0 0% 100% | Text on primary buttons |
| `--secondary` | 220 14% 96% | Secondary button backgrounds |
| `--secondary-foreground` | 220 9% 46% | Secondary text |
| `--destructive` | 0 84% 60% | Delete actions, failed status badge |
| `--destructive-foreground` | 0 0% 100% | Text on destructive |
| `--muted` | 220 14% 96% | Muted backgrounds (empty states, settings sections) |
| `--muted-foreground` | 220 9% 46% | Placeholder text, secondary labels |
| `--accent` | 220 14% 96% | Hover states |
| `--card` | 0 0% 100% | Card/panel backgrounds |
| `--card-foreground` | 220 9% 15% | Card text |
| `--border` | 220 13% 91% | All borders |
| `--input` | 220 13% 91% | Input borders |
| `--ring` | 142 71% 45% | Focus rings |

Dark mode variables are not defined — dark mode class is enabled in Tailwind config but no `dark:` CSS vars are set. Dark mode is essentially unsupported despite the config.

## Typography

- No custom font loaded. Falls back to system font stack via Tailwind defaults (`font-sans`).
- Body antialiased: `antialiased` class on `<body>`.
- Sizes used: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl` — standard Tailwind scale.
- Font weights: `font-medium`, `font-semibold`, `font-bold` used selectively.
- Truncation: `truncate` class on long strings in table cells.

## Spacing & Layout

- Sidebar: fixed `w-52` (208px), full height, with `p-4` internal padding.
- Content area: `flex-1`, `overflow-y-auto`, `p-6` padding.
- App root: `flex h-screen overflow-hidden`.
- Traffic light clearance: `body { padding-top: 2.5rem }` — required for macOS hiddenInset title bar.
- Cards: `rounded-lg border bg-card shadow-sm p-4` pattern (shadcn/ui Card primitive).
- Table rows: `border-b` separator, `py-3 px-4` cell padding.

## Border Radius

- `--radius: 0.5rem` (8px) — base radius.
- Applied across buttons, cards, inputs, badges, dialog.

## Shadows

- `shadow-sm` used on cards. No custom shadow tokens.

## Interaction Patterns

- Hover: `hover:bg-accent` or `hover:bg-gray-50/80` on list rows and nav items.
- Active tab: left border `border-l-2 border-primary text-primary` highlight.
- Buttons: shadcn/ui `Button` with `variant` prop (default, outline, ghost, destructive).
- Switches: shadcn/ui `Switch` for boolean settings (global dry-run toggle).
- Dropdowns: custom `div` overlay (contact search results), not shadcn Select.
- Modals: shadcn/ui `Dialog` for schedule create/edit.
- Confirmation prompts: inline state toggle in Dashboard — small inline confirm/cancel buttons, not a modal.

## Animation / Motion

- No custom animation or transition classes beyond Tailwind defaults.
- shadcn/ui Dialog uses Radix UI's built-in open/close animation.
- Contact search spinner: `animate-spin` on a `Loader2` icon.

## Consistency Issues

- Dark mode declared in config but no dark-mode variable set — theme is effectively light-only.
- Contact search results dropdown is a hand-rolled `div` while the rest of the form uses shadcn/ui Select — inconsistent pattern.
- Confirmation UX for delete is inline (small buttons in list row), but clear-logs confirmation is also inline in Logs page — acceptable but slightly different placement.
- No loading skeleton states — lists show nothing while fetching.
- No toast/notification system implemented — test-send result is shown as an inline string below the button row in Dashboard.

## Component Library

shadcn/ui primitives used (confirmed from `src/components/ui/`):
`badge`, `button`, `dialog`, `input`, `label`, `select`, `switch`, `textarea`

Icons from `lucide-react`: `Calendar`, `MessageSquare`, `Settings`, `Play`, `Trash2`, `Edit2`, `Copy`, `Check`, `X`, `Loader2`, `ChevronDown`, `Phone`.
