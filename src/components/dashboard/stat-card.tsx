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
    <article className="group relative flex flex-col gap-4 rounded-[calc(var(--radius)+4px)] border-2 border-border bg-[color:var(--surface-card)] p-4 shadow-retro transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--surface-secondary)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl tabular-nums sm:text-3xl">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-[calc(var(--radius)-1px)] border-2 border-border bg-[color:var(--surface-accent)] p-2.5 text-accent-foreground shadow-retro-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:p-3">
            <Icon className="size-4" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          {trend && (
            <span
              className={
                trend.value >= 0
                  ? "rounded-full border-2 border-border bg-secondary px-2 py-1 text-secondary-foreground shadow-retro-sm"
                  : "rounded-full border-2 border-border bg-destructive px-2 py-1 text-destructive-foreground shadow-retro-sm"
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
        : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

  return <section className={colClass}>{children}</section>;
}
