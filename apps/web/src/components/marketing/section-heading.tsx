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
        <p className="site-kicker font-sans">
          {eyebrow}
        </p>
      ) : null}
      <TitleTag
        className={cn(
          "max-w-[16ch] font-heading text-[clamp(2rem,5vw,4rem)] font-black leading-[1.02] tracking-[-0.05em] text-balance",
          centered ? "mx-auto" : ""
        )}
      >
        {title}
      </TitleTag>
      {description ? (
        <p
          className={cn(
            "max-w-[62ch] text-sm font-medium leading-7 text-muted-foreground sm:text-base sm:leading-8",
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
