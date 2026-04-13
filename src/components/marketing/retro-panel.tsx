import * as React from "react"

import { cn } from "@/lib/utils"

const toneClasses = {
  card: "bg-card text-card-foreground",
  accent: "bg-accent text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-foreground",
  primary: "bg-primary text-primary-foreground",
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
        "relative overflow-hidden rounded-[calc(var(--radius)+6px)] border-2 border-border shadow-retro",
        toneClasses[tone],
        size === "lg" ? "px-6 py-6 md:px-8 md:py-8" : "px-5 py-5 md:px-6 md:py-6",
        className
      )}
      {...props}
    />
  )
}

export { RetroPanel }
