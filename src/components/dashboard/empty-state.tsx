import Link from "next/link";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center p-8 sm:p-12 border border-dashed border-border/60 rounded-3xl bg-surface/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-foreground/50 mb-2">
        <Icon className="size-8" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-sm font-medium text-foreground/60 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {action && (
            <Link href={action.href}>
              <Button variant="primary" className="font-bold shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]">
                {action.label}
              </Button>
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href}>
                <Button variant="outline" className="font-bold border-border/40 bg-surface">
                {secondaryAction.label}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
