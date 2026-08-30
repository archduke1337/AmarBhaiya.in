/**
 * Marketing pages — loading skeleton
 * ───────────────────────────────────
 * Renders inside the (site) layout's <main>, between the fixed nav and the
 * footer, while server components fetch content. Calm pulsing blocks that
 * mirror each page's structure (page header → panels) without layout jump.
 */

export default function SiteLoading() {
  return (
    <div className="site-container space-y-12 py-12 sm:py-16 xl:space-y-16 xl:py-20 animate-pulse" aria-busy="true" aria-label="Loading page">
      {/* Page header skeleton */}
      <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
        <div className="space-y-5">
          <div className="h-3 w-24 rounded-full bg-surface-hover border border-border/20" />
          <div className="h-12 w-full max-w-md rounded-2xl bg-surface-hover border border-border/20" />
          <div className="h-12 w-3/4 max-w-sm rounded-2xl bg-surface-hover border border-border/20" />
          <div className="mt-2 h-4 w-full max-w-lg rounded-full bg-surface-hover border border-border/20" />
          <div className="h-4 w-2/3 max-w-md rounded-full bg-surface-hover border border-border/20" />
        </div>
        <div className="space-y-4 xl:translate-y-8">
          <div className="h-36 rounded-[calc(var(--radius)+4px)] bg-surface-hover border border-border/20 shadow-[var(--surface-shadow)]" />
          <div className="h-28 rounded-[calc(var(--radius)+4px)] bg-surface-hover border border-border/20 shadow-[var(--surface-shadow)]" />
        </div>
      </section>

      {/* Content panels skeleton */}
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="h-64 rounded-[calc(var(--radius)+4px)] bg-surface-hover border border-border/20 shadow-[var(--surface-shadow)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-[calc(var(--radius)+4px)] bg-surface-hover border border-border/20 shadow-[var(--surface-shadow)]"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
