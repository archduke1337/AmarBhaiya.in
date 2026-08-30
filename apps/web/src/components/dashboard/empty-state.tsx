import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-surface/30 p-8 text-center shadow-[var(--surface-shadow)] backdrop-blur-sm sm:p-12",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-foreground/60 mb-2">
        <Icon className="size-8" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="mb-2 font-heading text-xl font-normal tracking-[-0.02em]">{title}</h3>
        <p className="mx-auto max-w-md text-sm font-medium leading-6 text-foreground/60">
          {description}
        </p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {action && (
            <Button asChild className="font-bold shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button asChild variant="outline" className="font-bold border-border/40 bg-surface">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
