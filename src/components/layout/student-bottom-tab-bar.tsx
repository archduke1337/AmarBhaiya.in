"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Home, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

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
      aria-label="Student quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-[color:var(--surface-card)] px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 md:hidden"
    >
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-2 rounded-[calc(var(--radius)+8px)] border-2 border-border bg-background p-2 shadow-retro-sm">
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
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[calc(var(--radius)+2px)] border-2 px-1 py-2 text-center font-heading text-[0.62rem] font-black uppercase tracking-[0.08em] transition-all",
                active
                  ? "border-border bg-[color:var(--surface-secondary)] text-foreground shadow-retro-sm"
                  : "border-transparent bg-transparent text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
