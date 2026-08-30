"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
      <section className="w-full max-w-3xl space-y-8 rounded-3xl border border-border/40 bg-surface p-6 shadow-[var(--surface-shadow)] sm:p-8 md:p-10" aria-live="polite">
        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-muted-foreground">
          <AlertTriangle className="size-6" />
        </div>

        <p className="eyebrow self-start">Route Error</p>

        <div className="space-y-3">
          <h1 className="max-w-[16ch] font-heading text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.06] tracking-[-0.02em]">Something went wrong on this page.</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            This can happen because of a temporary network or server issue. You can safely retry,
            or move to a stable route and continue learning.
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground font-mono">Reference: {error.digest}</p>
          ) : null}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <button
            type="button"
            onClick={reset}
            className="h-11 px-4 bg-foreground text-background inline-flex items-center justify-center font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="h-11 px-4 border border-border/40 inline-flex items-center justify-center font-semibold rounded-xl transition-all hover:bg-surface-hover active:scale-[0.97]"
          >
            Home
          </Link>
          <Link
            href="/contact"
            className="h-11 px-4 border border-border/40 inline-flex items-center justify-center font-semibold rounded-xl transition-all hover:bg-surface-hover active:scale-[0.97]"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </main>
  );
}