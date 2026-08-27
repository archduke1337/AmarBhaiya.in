# Patterns

## Pattern: RetroPanel (marketing surface)

**Description**: The shared building block of every public site page. A bordered, rounded panel with a `tone` that swaps the surface color. Provides visual rhythm without repeated per-page styling.

**Usage**: Site pages only (`/about`, `/courses`, `/pricing`, `/contact`, `/blog`, `/support`, etc.); dashboards use lighter `card-bezel`/plain surfaces. Import from `@/components/marketing/retro-panel`.

**Constraints**: Don't use `RetroPanel` inside dashboards. Pair with `SectionHeading` for page headers. Tones cycle (card / accent / secondary / muted / primary) consistently across a page.

**Example structure**:
```tsx
<RetroPanel tone="secondary" size="lg" className="space-y-4">
  <p className="site-kicker font-sans">Eyebrow</p>
  <h2 className="font-heading text-2xl font-black tracking-[-0.05em]">Title</h2>
  <p className="text-sm font-medium leading-7 text-foreground/80">Body</p>
</RetroPanel>
```

## Pattern: SectionHeading (page header block)

**Description**: Standardizes a page's eyebrow + title + description, including `titleAs="h1"` on the primary page heading so every public page gets a semantic h1. Supports `align="center"`.

**Usage**: Every site page's top section; `titleAs="h1"` for the main page heading, `h2` inside repeated sections.

**Constraints**: Keep the successor heading same typeface (`font-heading`). Use `site-kicker` for the eyebrow.

## Pattern: card-bezel (double-bezel glass card)

**Description**: The hero/bento card treatment — an outer bezel (`card-bezel`) wrapping an inner surface (`card-bezel-inner`). Gives a premium "double border" look.

**Usage**: Homepage hero preview cards, subject grid, collections, features, testimonials, how-it-works. Site marketing surfaces.

**Constraints**: Always an outer `card-bezel` + inner `card-bezel-inner` pair; don't use one without the other. Hover micro-interactions (e.g. `group-hover:bg-surface/80`) belong on the inner.

## Pattern: Auth form (split layout + validation)

**Description**: Two-column auth layout (left editorial branding, right form) with live client-side validation. Reuses shared `Input` / `PasswordInput` (with show/hide toggle) / `Button`.

**Usage**: `(auth)` group — login, register, forgot-password, reset-password. Wrapped by `AuthLayout` which provides the branding column and safe-area padding.

**Constraints**: Errors render in a `role="alert"` box. Password inputs should mount live strength meter + use `PasswordInput` for visibility toggle. Preserve the anti-enumeration posture (never reveal whether an email exists). `sanitizeInternalRedirectPath` guards all redirect params.

## Pattern: Dashboard table row (compact DNI rows)

**Description**: Dense data tables across admin/instructor/mod moderator surfaces: small caps column headers (`text-[10px] font-bold uppercase tracking-wide text-muted-foreground`), status pills, and copy that truncates. Often a separate client `-table.tsx` component with its own sticky height classes.

**Usage**: Admin users/students/courses/payments, instructor students, moderator students.

**Constraints**: Header cells use the heading typeface with `font-black uppercase`. Status pills use `border + text-*-600 dark:text-*-400`. Control buttons must be ≥44px touch targets (use Button sizes, not raw `text-xs` links when they're actions).

## Pattern: Empty state

**Description**: Every list/dashboard view that depends on data shows a friendly empty state instead of a blank surface.

**Usage**: Courses list, notes, blog, dashboard tables, curriculum, marketing content blocks (when Appwrite content is unpublished).

**Constraints**: Copy acknowledges the absence + gives a next step (clear filter, revisit, or contact). Use `RetroPanel tone="muted"` on the site, or an inline bordered rounded box on dashboards. Keep semantics clear.

## Pattern: Searchable knowledge list (FAQ/search)

**Description**: A client "Searchable" wrapper that filters a static list by keyword with live match count (`role="status"` + `aria-live`), hiding empty groups and showing a clear empty state.

**Usage**: `/faq` via `SearchableFaq`. Reusable for any keyword-filterable static list.

**Constraints**: Filter in `useMemo` on trimmed lowercase query; match against both title and body. Provide a contact/fallback CTA in the empty state. Give the input a proper `<label>` (use `site-kicker`).

## Pattern: Accessible skip/off-screen utilities

**Description**: Skip-to-content links and focus-visible rings: `sr-only focus:not-sr-only` pattern (site layout), `:focus-visible { outline: 2.5px solid var(--focus) }` globally, `focus-visible:ring-[3px]` on all interactive UI components.

**Usage**: Global (globals.css base styles) + `(site)` layout skip link; every Button/Input/select/card interaction.

**Constraints**: Never rely on `:focus` alone (click-focus noise) — always `:focus-visible`. Keep the skip link's tap-target ≥44px when it appears.