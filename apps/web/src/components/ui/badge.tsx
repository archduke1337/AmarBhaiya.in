import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex min-h-7 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border-2 border-border px-3 py-1 text-[0.68rem] font-heading font-black uppercase tracking-[0.12em] whitespace-nowrap shadow-retro-sm transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--surface-primary)] text-foreground [a]:hover:bg-primary [a]:hover:text-primary-foreground",
        secondary:
          "bg-[color:var(--surface-secondary)] text-secondary-foreground [a]:hover:bg-secondary",
        destructive:
          "bg-destructive text-destructive-foreground focus-visible:ring-destructive/20 [a]:hover:bg-[color:var(--primary-hover)]",
        outline:
          "bg-[color:var(--surface-card)] text-foreground [a]:hover:bg-[color:var(--surface-accent)] [a]:hover:text-foreground",
        ghost:
          "bg-[color:var(--surface-accent)] text-accent-foreground [a]:hover:bg-[color:var(--surface-muted)] [a]:hover:text-foreground",
        link: "border-0 bg-transparent px-0 py-0 font-sans text-xs uppercase tracking-[0.08em] text-primary underline underline-offset-4 shadow-none hover:shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
