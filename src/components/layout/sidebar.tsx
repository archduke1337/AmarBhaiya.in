"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  Menu,
  MessageSquare,
  Repeat,
  Shield,
  TrendingUp,
  Trophy,
  UserCheck,
  UserRound,
  Users,
  Video,
  X,
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
    <aside className="h-full border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b bg-primary px-5 py-6 text-primary-foreground">
        <p className="font-heading text-xs uppercase tracking-[0.22em]">
          {role}
        </p>
        <h2 className="mt-3 text-3xl">Learning Hub</h2>
        <p className="mt-3 max-w-[16rem] text-sm font-semibold text-primary-foreground/80">
          Loud tools. Clear actions. Everything important in one chunky workspace.
        </p>
      </div>

      <nav className="flex flex-col gap-3 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[calc(var(--radius)+2px)] border-2 px-3 py-3 text-sm font-heading font-black uppercase tracking-[0.08em] transition-all",
                isActive
                  ? "border-border bg-accent text-accent-foreground shadow-retro"
                  : "border-border bg-card text-sidebar-foreground shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-none"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-6 pb-8">
        <div className="retro-surface bg-accent p-4">
          <p className="font-heading text-xs uppercase tracking-[0.18em] text-accent-foreground/70">
            Workspace
          </p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-accent-foreground">
            {getWorkspaceCopy(role)}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ role, userId }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = getNavItems(role, userId);

  // Auto-close on navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const closeDrawer = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card shadow-retro-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-sidebar shadow-retro-lg lg:hidden">
            <div className="absolute right-3 top-4 z-10">
              <button
                onClick={closeDrawer}
                className="inline-flex size-8 items-center justify-center rounded-[calc(var(--radius)+2px)] border-2 border-border bg-card shadow-retro-sm"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="border-b bg-primary px-5 py-6 text-primary-foreground">
              <p className="font-heading text-xs uppercase tracking-[0.22em]">
                {role}
              </p>
              <h2 className="mt-3 text-2xl">Learning Hub</h2>
            </div>

            <nav className="flex flex-col gap-3 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className={cn(
                      "flex items-center gap-3 rounded-[calc(var(--radius)+2px)] border-2 px-3 py-3 text-sm font-heading font-black uppercase tracking-[0.08em] transition-all",
                      isActive
                        ? "border-border bg-accent text-accent-foreground shadow-retro"
                        : "border-border bg-card text-sidebar-foreground shadow-retro-sm hover:bg-secondary hover:shadow-none"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
