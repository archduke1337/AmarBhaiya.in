import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border font-semibold text-sm whitespace-nowrap tracking-normal text-center cursor-pointer transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-[color:var(--primary-hover)]",
        outline:
          "bg-card text-card-foreground shadow-sm hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary shadow-sm hover:bg-secondary/80",
        ghost:
          "bg-transparent text-foreground border-transparent shadow-none hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/40",
        link:
          "h-auto rounded-none border-0 bg-transparent px-0 font-semibold text-sm text-foreground underline decoration-1 underline-offset-4 shadow-none hover:translate-y-0 hover:text-primary hover:shadow-none active:translate-y-0",
      },
      size: {
        default:
          "h-10 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-3.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 px-5 text-sm",
        icon: "size-10",
        "icon-xs":
          "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-5",
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
