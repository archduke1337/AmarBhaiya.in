"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type StudentBottomTabBarProps = {
  userId: string;
};

const tabs = [
  {
    label: "Home",
    href: "/app/dashboard",
    icon: Home,
    match: (pathname: string) => pathname === "/app/dashboard",
  },
  {
    label: "Courses",
    href: "/app/courses",
    icon: BookOpen,
    match: (pathname: string) =>
      pathname.startsWith("/app/courses") || pathname.startsWith("/app/learn"),
  },
  {
    label: "Notes",
    href: "/notes",
    icon: FileText,
    match: (pathname: string) => pathname.startsWith("/notes"),
  },
  {
    label: "Profile",
    href: "",
    icon: UserRound,
    match: (pathname: string) => pathname.startsWith("/app/profile"),
  },
] as const;

export function StudentBottomTabBar({
  userId,
}: StudentBottomTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Student fast navigation"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden flex justify-center pb-safe"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 0.5rem)" }}
    >
      <div 
        className="mx-4 w-full max-w-sm flex items-center justify-between p-2 nav-island"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const href = tab.label === "Profile" ? `/app/profile/${userId}` : tab.href;
          const active = tab.match(pathname);

          return (
            <Link
              key={tab.label}
              href={href}
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
