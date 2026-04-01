"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div className="rounded-full border border-border p-4 text-muted-foreground">
        <AlertTriangle className="size-8" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button variant="outline" onClick={reset} className="gap-2">
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
