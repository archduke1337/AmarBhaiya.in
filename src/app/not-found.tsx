import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] px-6 py-16 md:py-24 flex items-center justify-center">
      <section className="w-full max-w-3xl border border-border p-8 md:p-10 space-y-8 animate-fade-in-up">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Error 404</p>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl">This page does not exist anymore.</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            The link may be outdated, the route may have changed, or the resource was removed.
            Use one of the safe paths below to continue.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Link
            href="/"
            className="h-11 px-4 border border-border inline-flex items-center justify-center"
          >
            Home
          </Link>
          <Link
            href="/courses"
            className="h-11 px-4 border border-border inline-flex items-center justify-center"
          >
            Explore Courses
          </Link>
          <Link
            href="/app/dashboard"
            className="h-11 px-4 bg-foreground text-background inline-flex items-center justify-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}