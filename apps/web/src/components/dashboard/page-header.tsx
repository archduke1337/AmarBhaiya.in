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
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="eyebrow self-start">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-black tracking-[-0.03em] leading-none">
          {title}
        </h1>
        {description && (
          <p className="max-w-[42rem] text-sm md:text-base font-medium text-foreground/60 leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center mt-2 md:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
