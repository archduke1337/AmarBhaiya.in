import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[calc(var(--radius)+2px)] border font-sans text-[0.8rem] font-bold whitespace-nowrap tracking-[0.02em] text-center cursor-pointer transition-[background-color,border-color,box-shadow,color,transform] duration-150 select-none outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-retro-sm hover:bg-[color:var(--primary-hover)]",
        outline:
          "border-border bg-[color:var(--surface-card)] text-card-foreground shadow-retro-sm hover:bg-[color:var(--surface-accent)] aria-expanded:bg-[color:var(--surface-accent)]",
        secondary:
          "border-transparent bg-[color:var(--surface-secondary)] text-foreground shadow-retro-sm hover:bg-secondary aria-expanded:bg-secondary",
        ghost:
          "border-transparent bg-transparent text-foreground/75 hover:bg-[color:var(--surface-accent)] hover:text-foreground aria-expanded:bg-[color:var(--surface-muted)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-retro-sm hover:bg-[color-mix(in_oklab,var(--destructive)_92%,black_8%)] focus-visible:ring-destructive/40",
        link:
          "h-auto rounded-none border-0 bg-transparent px-0 font-sans text-sm font-semibold text-foreground underline decoration-2 underline-offset-4 shadow-none hover:text-primary",
      },
      size: {
        default:
          "min-h-11 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 px-3 text-[0.68rem] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-3.5 text-[0.72rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-12 px-5 text-[0.88rem]",
        icon: "size-11",
        "icon-xs":
          "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
