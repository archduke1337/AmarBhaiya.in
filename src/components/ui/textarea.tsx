import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-32 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3.5 py-3 text-sm font-semibold text-foreground shadow-retro-sm transition-all outline-none placeholder:font-medium placeholder:text-muted-foreground focus-visible:-translate-y-px focus-visible:translate-x-px focus-visible:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
