import * as React from "react"

import { cn } from "@/lib/utils"

const toneClasses = {
  card: "bg-[color:var(--surface-card)] text-card-foreground",
  accent: "bg-[color:var(--surface-accent)] text-foreground",
  secondary: "bg-[color:var(--surface-secondary)] text-foreground",
  muted: "bg-[color:var(--surface-muted)] text-foreground",
  primary: "bg-[color:var(--surface-primary)] text-foreground",
  brand: "bg-primary text-primary-foreground",
} as const

type RetroPanelProps = React.ComponentProps<"div"> & {
  tone?: keyof typeof toneClasses
  size?: "md" | "lg"
}

function RetroPanel({
  className,
  tone = "card",
  size = "md",
  ...props
}: RetroPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border shadow-retro-sm",
        toneClasses[tone],
        size === "lg" ? "px-5 py-5 md:px-7 md:py-7" : "px-4 py-4 md:px-5 md:py-5",
        className
      )}
      {...props}
    />
  )
}

export { RetroPanel }
