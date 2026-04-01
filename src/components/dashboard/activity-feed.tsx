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
    <section className="border border-border">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        )}
        {items.map((item) => {
          const content = (
            <div className="flex items-start justify-between gap-3 px-5 py-3.5">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.badge && (
                  <span className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {item.badge}
                  </span>
                )}
                {item.timestamp && (
                  <span className="text-xs tabular-nums text-muted-foreground">
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
              className="block transition-colors hover:bg-muted/50"
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
