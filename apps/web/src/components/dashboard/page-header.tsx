import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && (
          <p className="eyebrow self-start">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-4xl break-words font-heading text-[clamp(1.75rem,3vw,2.75rem)] font-normal leading-[1.08] tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[42rem] text-sm font-medium leading-7 text-foreground/60 md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 mt-2 md:mt-0 md:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
