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
      <div className="mx-4 w-full max-w-sm flex items-center justify-between p-2 nav-island">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-full px-3 py-2 min-w-[64px] min-h-[44px] transition-all duration-300",
                active
                  ? "text-accent bg-accent/10"
                  : "text-foreground/50 hover:text-foreground/80 hover:bg-surface/50"
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-300",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[0.625rem] font-bold tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
