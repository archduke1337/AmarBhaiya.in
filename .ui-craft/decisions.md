# Design Decisions

### 2026-08-27 — Editorial vs UI typography split

**Status**: accepted

Page/panel headings on both site and dashboards use the serif `font-heading` (DM Serif), while compact DNI headings, table headers, labels, and form-field titles use the sans `font-black`. We keep this split because the serif carries the editorial/trust register on marketing pages, but dense UI needs the tighter sans. Constraint: use `font-heading` for page/panel titles; don't force it onto tables or inline form headings.

### 2026-08-27 — Status colors use Tailwind hues, not semantic text tokens

**Status**: accepted

Despite defining `--success`/`--warning` semantic tokens, the codebase renders status colors with Tailwind hues (`text-emerald-600 dark:text-emerald-400`, `text-amber-500`, `text-purple-500`, `text-red-600`). We standardized on this because it's what the tables/checkout already do and icons read well at `-500`. Constraint: always pair the `dark:` variant for text; keep `-500` for icons.

### 2026-08-27 — site uses RetroPanel/card-bezel; dashboards use lighter surfaces

**Status**: accepted

Marketing pages use the hard-offset `shadow-retro`/`RetroPanel`/`card-bezel` editorial treatment; dashboards use softer `surface-shadow` cards and compact tables. Kept separate so the marketing conversion story and the dense workspace don't visually fight. Constraint: don't drop `RetroPanel` into dashboards; don't bring table-DNI density into marketing pages.

### 2026-08-27 — Mobile touch targets fixed at 44px minimum

**Status**: enforced

Global base style enforces 44×44px on interactive controls; shared `Button` sizes (`default min-h-11`, `lg min-h-12`) and `min-h-11` on custom controls guarantee it. Small raw `text-xs` links used as primary actions were upgraded to real buttons (dashboard passes) because sub-44px controls fail on phones.

### 2026-08-27 — Replaced dashboard nav gap + removed orphaned pages

**Status**: accepted

`/instructor/coupons` was reachable only via a deep link and is now in the same sidebar; `/instructor/resource-library` was a 440-line duplicate of `/instructor/resources` with zero inbound links and was deleted. Rationale: one source of truth per flow, no orphaned routes.

### 2026-08-27 — Auth never reveals whether an account exists

**Status**: accepted

Login, register, forgot-password, and reset all return generic messages regardless of whether the email exists; reset-password invalid/expired links show a neutral "invalid link" state. Chosen to prevent account enumeration. Keep this posture in any new auth surface.