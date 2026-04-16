import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type ActivityItem = {
  id: string;
  label: string;
  description: string;
  badge?: string;
  timestamp?: string;
  href?: string;
};

interface ActivityFeedProps {
  title: string;
  items: ActivityItem[];
  emptyText?: string;
  viewAllHref?: string;
}

export function ActivityFeed({
  title,
  items,
  emptyText = "Nothing to show right now.",
  viewAllHref,
}: ActivityFeedProps) {
  return (
    <div className="flex flex-col rounded-3xl bg-surface border border-border/40 overflow-hidden relative">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-surface/50">
        <h3 className="font-bold text-base tracking-tight">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-bold uppercase tracking-[0.1em] text-accent hover:text-accent-foreground transition-colors"
          >
            View All
          </Link>
        )}
      </div>

      <div className="flex flex-col">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm font-medium text-foreground/50">
            {emptyText}
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {items.map((item) => {
              const content = (
                <div className="flex flex-col gap-2 relative z-10">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-sm leading-tight max-w-[85%] truncate">
                      {item.label}
                    </p>
                    {item.badge && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.05em] bg-accent/10 text-accent outline outline-1 outline-accent/20">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium text-foreground/60 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    {item.timestamp && (
                      <span className="shrink-0 text-[10px] font-bold text-foreground/40 whitespace-nowrap">
                        {item.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );

              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block px-5 py-4 transition-colors hover:bg-surface-hover group"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div key={item.id} className="px-5 py-4">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
