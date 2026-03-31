"use client";

import Link from "next/link";
import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="min-h-[70vh] px-6 py-16 md:py-24 flex items-center justify-center">
      <section
        className="w-full max-w-3xl border border-border p-8 md:p-10 space-y-8 animate-fade-in-up"
        aria-live="polite"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Route Error</p>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl">Something went wrong on this page.</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            This can happen because of a temporary network or server issue. You can safely retry,
            or move to a stable route and continue learning.
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
          ) : null}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <button
            type="button"
            onClick={reset}
            className="h-11 px-4 bg-foreground text-background inline-flex items-center justify-center"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="h-11 px-4 border border-border inline-flex items-center justify-center"
          >
            Home
          </Link>
          <Link
            href="/contact"
            className="h-11 px-4 border border-border inline-flex items-center justify-center"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </main>
  );
}