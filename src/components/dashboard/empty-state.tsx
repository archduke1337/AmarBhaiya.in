import { type LucideIcon, Inbox } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <article className="retro-surface flex flex-col items-center justify-center gap-5 bg-[color:var(--surface-card)] px-5 py-12 text-center sm:px-6 sm:py-16">
      <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-accent)] p-4 text-accent-foreground shadow-retro-sm">
        <Icon className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl tracking-[-0.04em]">{title}</h3>
        <p className="max-w-sm text-sm font-medium leading-7 text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex h-11 items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-secondary)] px-4 text-sm font-heading font-black uppercase tracking-[0.1em] shadow-retro transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none"
        >
          {action.label}
        </Link>
      )}
    </article>
  );
}
