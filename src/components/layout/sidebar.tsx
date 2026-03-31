"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/utils/constants";

type SidebarProps = {
  role: Role;
  userId: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getStudentNav(userId: string): NavItem[] {
  return [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    {
      label: "Course Player",
      href: "/app/courses/complete-coding-bootcamp",
      icon: BookOpen,
    },
    { label: "Community", href: "/app/community", icon: MessageSquare },
    { label: "Profile", href: `/app/profile/${userId}`, icon: UserRound },
  ];
}

export function Sidebar({ role, userId }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getStudentNav(userId);

  return (
    <aside className="h-full border-r border-border bg-background">
      <div className="px-5 py-6 border-b border-border">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {role}
        </p>
        <h2 className="text-xl mt-2">Learning Hub</h2>
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm transition-colors border border-transparent",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-6 pb-8">
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Phase 5
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Course player and student experience are now active in this section.
          </p>
        </div>
      </div>
    </aside>
  );
}
