import Link from "next/link";

type ActivityItem = {
  id: string;
  label: string;
  description: string;
  timestamp?: string;
  href?: string;
  badge?: string;
};

type ActivityFeedProps = {
  title: string;
  items: ActivityItem[];
  emptyText?: string;
  viewAllHref?: string;
};

export function ActivityFeed({
  title,
  items,
  emptyText = "No recent activity.",
  viewAllHref,
}: ActivityFeedProps) {
  return (
    <section className="retro-surface overflow-hidden bg-card">
      <div className="flex items-center justify-between border-b bg-secondary/75 px-5 py-3.5">
        <h2 className="font-heading text-base font-black">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-heading uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 && (
          <p className="px-5 py-8 text-center text-sm font-semibold text-muted-foreground">
            {emptyText}
          </p>
        )}
        {items.map((item) => {
          const content = (
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.badge && (
                  <span className="rounded-full border-2 border-border bg-accent px-2.5 py-1 text-[0.62rem] font-heading font-black uppercase tracking-[0.14em] text-accent-foreground shadow-retro-sm">
                    {item.badge}
                  </span>
                )}
                {item.timestamp && (
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {item.timestamp}
                  </span>
                )}
              </div>
            </div>
          );

          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className="block transition-all hover:bg-accent/40"
            >
              {content}
            </Link>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
