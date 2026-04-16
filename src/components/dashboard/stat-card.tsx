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
    <div className={cn("bg-surface border border-border/40 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm text-foreground/60">{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-accent">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-3xl font-black tracking-[-0.03em] leading-none">{value}</p>
      </div>
      {(description || trend) && (
        <div className="flex items-center gap-2 mt-auto pt-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md",
                trend.direction === "up" && "bg-success/10 text-success",
                trend.direction === "down" && "bg-danger/10 text-danger",
                trend.direction === "neutral" && "bg-surface-hover text-foreground/70"
              )}
            >
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}%
            </span>
          )}
          {description && (
            <p className="text-xs font-medium text-foreground/50 truncate">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
