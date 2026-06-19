import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] px-6 py-16 md:py-24 flex items-center justify-center">
      <section className="w-full max-w-3xl bg-surface border border-border/40 rounded-2xl p-8 md:p-10 space-y-8">
        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-muted-foreground">
          <FileQuestion className="size-6" />
        </div>

        <p className="eyebrow self-start">Error 404</p>

        <div className="space-y-3">
          <h1 className="font-heading text-3xl md:text-5xl font-black tracking-[-0.05em]">This page does not exist anymore.</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            The link may be outdated, the route may have changed, or the resource was removed.
            Use one of the safe paths below to continue.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Link
            href="/"
            className="h-11 px-4 border border-border/40 inline-flex items-center justify-center font-semibold rounded-xl transition-all hover:bg-surface-hover active:scale-[0.97]"
          >
            Home
          </Link>
          <Link
            href="/courses"
            className="h-11 px-4 border border-border/40 inline-flex items-center justify-center font-semibold rounded-xl transition-all hover:bg-surface-hover active:scale-[0.97]"
          >
            Explore Courses
          </Link>
          <Link
            href="/app/dashboard"
            className="h-11 px-4 bg-foreground text-background inline-flex items-center justify-center font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}