import * as React from "react"

import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
  titleAs?: "h1" | "h2" | "h3"
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleAs = "h2",
}: SectionHeadingProps) {
  const centered = align === "center"
  const TitleTag = titleAs

  return (
    <div
      className={cn(
        "space-y-4",
        centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className
      )}
    >
      {eyebrow ? (
        <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <TitleTag
        className={cn(
          "font-heading text-4xl leading-[0.94] font-black tracking-[-0.06em] text-balance md:text-6xl",
          centered ? "mx-auto" : ""
        )}
      >
        {title}
      </TitleTag>
      {description ? (
        <p
          className={cn(
            "text-base font-medium leading-7 text-muted-foreground md:text-lg",
            centered ? "mx-auto" : ""
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

export { SectionHeading }
