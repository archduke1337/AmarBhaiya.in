export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Page header skeleton */}
      <section className="flex flex-col gap-3">
        <div className="h-3 w-28 rounded-full bg-surface-hover border border-border/20" />
        <div className="h-10 w-72 rounded-2xl bg-surface-hover border border-border/20" />
        <div className="h-4 w-96 max-w-full rounded-full bg-surface-hover border border-border/20 mt-1" />
      </section>

      {/* Stat cards skeleton */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[calc(var(--radius)+8px)] bg-surface border border-border/30 p-5 shadow-[var(--surface-shadow)]">
            <div className="mb-4 h-3 w-24 rounded-full bg-surface-hover" />
            <div className="h-8 w-16 rounded-xl bg-surface-hover" />
          </div>
        ))}
      </section>

      {/* Content skeleton */}
      <section className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[calc(var(--radius)+8px)] bg-surface border border-border/30 p-5 shadow-[var(--surface-shadow)]">
            <div className="mb-3 h-6 w-56 rounded-xl bg-surface-hover" />
            <div className="h-4 w-3/4 rounded-full bg-surface-hover mb-4" />
            <div className="h-2 w-full rounded-full bg-surface-hover/50 overflow-hidden">
               <div className="h-full w-2/3 bg-surface-hover rounded-full" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
