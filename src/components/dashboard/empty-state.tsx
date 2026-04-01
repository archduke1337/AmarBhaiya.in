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
    <article className="flex flex-col items-center justify-center gap-4 border border-dashed border-border px-6 py-16 text-center">
      <div className="rounded-full border border-border p-4 text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex h-9 items-center gap-2 border border-border px-4 text-sm transition-colors hover:bg-muted"
        >
          {action.label}
        </Link>
      )}
    </article>
  );
}
