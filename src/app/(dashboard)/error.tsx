"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center animate-fade-in-up">
      <div className="rounded-[calc(var(--radius)+4px)] bg-danger/10 p-5 text-danger border border-danger/20 shadow-sm relative overflow-hidden">
        <div aria-hidden className="absolute -top-3 -right-3 w-12 h-12 bg-danger blur-xl opacity-20 rounded-full" />
        <AlertTriangle className="size-10 relative z-10" />
      </div>
      <div className="flex flex-col gap-2 relative z-10">
        <h2 className="text-2xl font-black tracking-tight">Something went wrong</h2>
        <p className="max-w-md text-base font-medium text-foreground/60 leading-relaxed">
          {error.message || "An unexpected error occurred while loading this view. Please try reloading."}
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-foreground/40 mt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button 
        onPress={reset} 
        variant="outline" 
        size="lg" 
        className="font-bold border-border/40 hover:bg-surface-hover mt-4"
      >
        <span className="inline-flex items-center gap-2">
          <RefreshCw className="size-4" />
          Try again
        </span>
      </Button>
    </div>
  );
}
