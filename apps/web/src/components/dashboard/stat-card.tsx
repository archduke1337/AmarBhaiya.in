import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("relative flex min-h-32 min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-border/50 bg-surface p-5 shadow-[var(--surface-shadow)] transition-[box-shadow,border-color] duration-200 hover:border-border hover:shadow-[var(--overlay-shadow)]", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">{label}</p>
        {Icon && (
          <div className="flex size-9 items-center justify-center rounded-xl border border-border/50 bg-surface-hover text-accent">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <div className="mt-auto flex items-baseline gap-2">
        <p className="font-heading text-3xl font-normal leading-none tracking-[-0.02em]">{value}</p>
      </div>
      {(description || trend) && (
        <div className="flex items-center gap-2 mt-auto pt-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-bold",
                trend.direction === "up" && "bg-success/10 text-success",
                trend.direction === "down" && "bg-danger/10 text-danger",
                trend.direction === "neutral" && "bg-surface-hover text-foreground/70"
              )}
            >
              {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : "~"} {trend.value}%
            </span>
          )}
          {description && (
            <p className="min-w-0 text-xs font-medium leading-5 text-foreground/60">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
