import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3.5 py-2 text-sm font-semibold text-foreground shadow-retro-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-semibold file:text-foreground placeholder:font-medium placeholder:text-muted-foreground focus-visible:-translate-y-px focus-visible:translate-x-px focus-visible:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
