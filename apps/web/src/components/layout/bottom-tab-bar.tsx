"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { Role } from "@/lib/utils/constants";
import { getBottomTabItems } from "@/config/dashboard-nav";

type BottomTabBarProps = {
  role: Role;
  userId: string;
};

export function BottomTabBar({ role, userId }: BottomTabBarProps) {
  const pathname = usePathname();
  const tabs = getBottomTabItems(role, userId);

  return (
    <nav
      aria-label={`${role} navigation`}
      className="fixed inset-x-0 bottom-0 z-40 md:hidden flex justify-center pb-safe"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 0.5rem)" }}
    >
      <div className="mx-3 flex w-full max-w-lg items-center justify-between gap-1 p-2 nav-island sm:mx-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 transition-all duration-200 sm:min-w-[64px] sm:px-3",
                active
                  ? "text-accent bg-accent/10"
                  : "text-foreground/60 hover:text-foreground/90 hover:bg-surface/50"
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-300",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="max-w-full truncate text-[0.625rem] font-bold tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
