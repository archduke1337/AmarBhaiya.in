"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileText,
  Folder,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Repeat,
  Shield,
  TrendingUp,
  Trophy,
  UserCheck,
  UserRound,
  Users,
  Video,
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
  exact?: boolean;
  matchPrefixes?: string[];
};

function getNavItems(role: Role, userId: string): NavItem[] {
  if (role === "admin") {
    return [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Student Data", href: "/admin/students", icon: GraduationCap },
      { label: "Instructors", href: "/admin/instructors", icon: UserCheck },
      { label: "Courses", href: "/admin/courses", icon: BookOpen },
      { label: "Categories", href: "/admin/categories", icon: Folder },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: Repeat },
      { label: "Live Sessions", href: "/admin/live", icon: Video },
      { label: "Moderation", href: "/admin/moderation", icon: Shield },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Audit Logs", href: "/admin/audit", icon: FileText },
    ];
  }

  if (role === "instructor") {
    return [
      { label: "Dashboard", href: "/instructor", icon: LayoutDashboard, exact: true },
      { label: "My Courses", href: "/instructor/courses", icon: BookOpen },
      { label: "Resources", href: "/instructor/resources", icon: FileText },
      { label: "Categories", href: "/instructor/categories", icon: Folder },
      { label: "Students", href: "/instructor/students", icon: Users },
      { label: "Submissions", href: "/instructor/submissions", icon: ClipboardCheck },
      { label: "Live Sessions", href: "/instructor/live", icon: Video },
      { label: "Earnings", href: "/instructor/earnings", icon: TrendingUp },
    ];
  }

  if (role === "moderator") {
    return [
      { label: "Dashboard", href: "/moderator", icon: LayoutDashboard, exact: true },
      { label: "Reports", href: "/moderator/reports", icon: Flag },
      { label: "Students", href: "/moderator/students", icon: Users },
      { label: "Community", href: "/moderator/community", icon: MessageSquare },
    ];
  }

  return [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard, exact: true },
    {
      label: "My Courses",
      href: "/app/courses",
      icon: BookOpen,
      matchPrefixes: ["/app/courses", "/app/learn"],
    },
    { label: "Assignments", href: "/app/assignments", icon: ClipboardCheck },
    {
      label: "Quizzes",
      href: "/app/quizzes",
      icon: Trophy,
      matchPrefixes: ["/app/quizzes", "/app/quiz"],
    },
    { label: "Live Sessions", href: "/app/live", icon: Video },
    { label: "Notifications", href: "/app/notifications", icon: Bell },
    { label: "Billing", href: "/app/billing", icon: CreditCard },
    { label: "Community", href: "/app/community", icon: MessageSquare },
    {
      label: "Profile",
      href: `/app/profile/${userId}`,
      icon: UserRound,
      matchPrefixes: ["/app/profile"],
    },
  ];
}

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) {
    return true;
  }

  if (item.exact) {
    return false;
  }

  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some((prefix) => pathname.startsWith(`${prefix}/`));
}

function getWorkspaceCopy(role: Role): string {
  if (role === "admin") {
    return "Run the platform, review operational alerts, and oversee users, content, and revenue.";
  }

  if (role === "instructor") {
    return "Manage your courses, resources, students, submissions, and live sessions from one place.";
  }

  if (role === "moderator") {
    return "Review reports, moderate community threads, and keep track of active sanctions.";
  }

  return "Continue learning, manage assignments, join live sessions, and stay on top of notifications.";
}

export function Sidebar({ role, userId }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role, userId);

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
          const isActive = isNavItemActive(pathname, item);

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
            Workspace
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {getWorkspaceCopy(role)}
          </p>
        </div>
      </div>
    </aside>
  );
}
