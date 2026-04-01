export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header skeleton */}
      <section className="flex flex-col gap-2">
        <div className="h-3 w-24 animate-pulse bg-muted" />
        <div className="h-9 w-64 animate-pulse bg-muted" />
        <div className="h-4 w-96 animate-pulse bg-muted" />
      </section>

      {/* Stat cards skeleton */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border p-5">
            <div className="mb-3 h-3 w-20 animate-pulse bg-muted" />
            <div className="h-7 w-16 animate-pulse bg-muted" />
          </div>
        ))}
      </section>

      {/* Content skeleton */}
      <section className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border p-5">
            <div className="mb-2 h-5 w-48 animate-pulse bg-muted" />
            <div className="h-3 w-72 animate-pulse bg-muted" />
            <div className="mt-3 h-1.5 w-full animate-pulse bg-muted" />
          </div>
        ))}
      </section>
    </div>
  );
}
