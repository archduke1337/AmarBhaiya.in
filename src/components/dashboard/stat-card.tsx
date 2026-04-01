import { type LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
};

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
}: StatCardProps) {
  return (
    <article className="group relative border border-border bg-card p-5 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-md border border-border p-2 text-muted-foreground transition-colors group-hover:text-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={
                trend.value >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          {description && <span>{description}</span>}
          {trend && <span>{trend.label}</span>}
        </div>
      )}
    </article>
  );
}

type StatGridProps = {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
};

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  const colClass =
    columns === 2
      ? "grid gap-4 sm:grid-cols-2"
      : columns === 3
        ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";

  return <section className={colClass}>{children}</section>;
}
