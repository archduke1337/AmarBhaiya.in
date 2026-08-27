# Design Tokens

Source of truth: `apps/web/src/app/globals.css`. All colors are authored in OKLCH for better perceptual uniformity. Two themes exist — `:root` (light, warm cream) and `.dark` (deep OLED near-black). Every surface/typography token has both variants.

## Colors

### Brand accent (saffron/amber) — maps to the shadcn `primary`
- Light: `--accent: oklch(0.72 0.17 55)` (~#F5A623 warm amber). `--accent-foreground: var(--eclipse)` (near-black text on amber).
- Dark: `--accent: oklch(0.78 0.17 55)` (glows warmer). `--accent-foreground: oklch(0.10 0.005 85)`.
- Hover: `--primary-hover: color-mix(in oklab, var(--accent) 88%, var(--eclipse) 12%)`.

Used for: primary buttons, active nav states, links, focus, checkboxes, eyebrows/kickers, accents on cards and toggles.

### Background & text
- Light: `--background: oklch(0.978 0.012 88)` (warm cream-white), `--foreground: var(--eclipse)` where `--eclipse: oklch(0.1103 0.0059 285.89)`.
- Dark: `--background: oklch(0.110 0.012 262)` (deep OLED near-black), `--foreground: oklch(0.960 0.005 88)`.

### Surfaces (all have light + dark variants)
- `--surface` (card base): light `oklch(1 0 0)` / dark `oklch(0.155 0.010 262)`
- `--surface-card`: alias of `--surface` (light) / dark `oklch(0.18 0.01 262)`
- `--surface-secondary` = `--default`: light `oklch(0.945 0.008 88)` / dark `oklch(0.220 0.008 262)`
- `--surface-accent`: `color-mix(in oklab, var(--accent) 10%, var(--surface) 90%)` (dark: 14%)
- `--surface-muted`: light `color-mix(surface 88%, muted 12%)` / dark `oklch(0.20 0.008 262)`
- `--surface-primary` = `--accent`
- `--surface-hover`: `color-mix(surface 88%, accent 12%)` (dark: 90%/10%)
- `--surface-ink`: light `color-mix(foreground 6%, surface)` / dark `oklch(0.22 0.008 262)`

### Muted / border
- Light: `--muted: oklch(0.52 0.01 88)`, `--border: oklch(0.87 0.007 88 / 80%)`, `--separator: oklch(0.91 0.005 88)`.
- Dark: `--muted: oklch(0.60 0.010 262)`, `--border: oklch(0.25 0.008 262 / 70%)`.
- `text-muted-foreground` maps to `--muted` (the mid gray above), so muted text is the gray, NOT 50% opacity — prefer `text-muted-foreground` over `text-foreground/50` for gray text.

### Semantic status
- Success: light `oklch(0.72 0.17 148)` / `--success-foreground: var(--eclipse)`.
- Warning: `oklch(0.79 0.16 72)` (light) / `oklch(0.82 0.14 76)` (dark).
- Danger: `oklch(0.63 0.21 25)` (light) / `oklch(0.60 0.195 25)` (dark), `--danger-foreground: var(--snow)`.
- In status text/icons, the codebase consistently uses **Tailwind hues** (`text-emerald-600 dark:text-emerald-400`, `text-amber-500`, `text-purple-500`, `text-red-600`) rather than the semantic `text-success`/`text-warning` tokens. Match the existing per-file pattern (`text-*-600 dark:*-400` for text; `text-*-500` for icons).

### Form fields
- `--field-background: var(--white)` (light) / `oklch(0.190 0.010 262)` (dark).
- `--field-border: oklch(0.88 0.005 88)` (light) / `oklch(0.25 0.010 262)` (dark).
- The shared `Input` component uses `bg-input` (maps to `--field-background`). Auth forms additionally layer `bg-surface shadow-[var(--field-shadow)]`.

## Typography

- **Body / UI (`--font-sans`)**: Plus Jakarta Sans (via `--font-body`), fallback system-ui. Used for all body copy, buttons, labels, tables, inputs.
- **Display / Headings (`--font-heading`)**: DM Serif Display (via `--font-display`), fallback Georgia serif. Used for `font-heading` headings on site **and** dashboard (page headers, panel titles, modals, `SectionHeading`).
  - Exception: inline form/dialog headings and admin table headers often use the sans font with `font-black` — this editorial-vs-UI split is intentional; use `font-heading` for page/panel titles, plain `font-black` sans for compact DNI headings.
- Mono: ui-monospace/SF Mono (code, IDs, markdown code spans).
- Headings (global): `h1 { font-size: clamp(2.25rem, 6vw, 4.75rem) }`, `h2 clamp(1.75rem, 4vw, 3rem)`, `h3 clamp(1.25rem, 2.5vw, 1.75rem)`, `font-weight 700`, `line-height 1.08`, `letter-spacing -0.03em`. `SectionHeading` overrides with `clamp(2rem, 5vw, 4rem)`.
- Small/caps labels: use `eyebrow`/`site-kicker` utility (0.7rem, weight 800, uppercase, `letter-spacing 0.16em`, accent color) — not ad-hoc `text-[10px] uppercase`.

## Spacing

- Base unit 4px (Tailwind `--spacing: 0.25rem`).
- Component padding convention: cards `p-5 sm:p-6` / large `p-6 md:p-8`; sections `px-4 sm:px-6` within `max-w-5xl` (72rem = `site-container`).
- Rhythm: `.section-pad { padding-block: clamp(4rem, 9vw, 7rem) }`, `.section-pad-sm { clamp(2.75rem, 6vw, 4.5rem) }`.
- **Touch targets: minimum 44×44pt** (Apple HIG) — enforced globally on buttons/role=button/tap-targets, plus `min-h-11` on interactive controls. Never ship controls under 44px.

## Radius

- Base `--radius: 0.875rem` (Apple scale). Derived: `--radius-sm calc(0.6x)`, `--radius-md (0.8x)`, `--radius-lg (1x)`, `--radius-xl (1.4x)`, `-2xl 1.8x`, `-3xl 2.2x`, `-4xl 2.6x`.
- `--field-radius: calc(var(--radius) * 1.2)`.
- Shared components: `Input`/`Button` use `rounded-[calc(var(--radius)+2px)]`. `RetroPanel` uses `rounded-[calc(var(--radius)+6px)]`. Pill/island nav uses `rounded-full` (999px). Badges `rounded-full`.

## Shadows

- Retro (border-accent UI): `--shadow-retro: 4px 4px 0 0 var(--border)`, `--shadow-retro-sm: 2px 2px 0 0 var(--border)` — the signature "hard offset" shadow used across cards, inputs, panels.
- Soft ambient: `--surface-shadow` (cards), `--overlay-shadow` (modals/overlays), `--field-shadow` (inputs) — soft iOS-style, heavier in dark mode.
- Glow: `.glow-accent` / `.glow-accent-sm` radial accent box-shadows for primary CTAs.