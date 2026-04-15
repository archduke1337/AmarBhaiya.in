"use client";

import Link from "next/link";
import Image from "next/image";
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
import { Button } from "@/components/ui/button";

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

function getRoleLabel(role: Role): string {
  if (role === "admin") return "Admin Panel";
  if (role === "instructor") return "Instructor Panel";
  if (role === "moderator") return "Moderator Panel";
  return "My Learning";
}

function NavItemLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarContent({
  role,
  userId,
  pathname,
  onNavigate,
}: {
  role: Role;
  userId: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const navItems = getNavItems(role, userId);

  return (
    <>
      <div className="border-b border-border bg-card px-5 py-5">
        <Link href="/" className="inline-flex items-center" aria-label="Amar Bhaiya home">
          <Image
            src="/AMAR%20BHAIYA.png"
            alt="Amar Bhaiya"
            width={140}
            height={46}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {getRoleLabel(role)}
        </p>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavItemLink
            key={item.href}
            item={item}
            isActive={isNavItemActive(pathname, item)}
            onClick={onNavigate}
          />
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ role, userId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block h-full overflow-y-auto border-r border-border bg-card">
      <SidebarContent role={role} userId={userId} pathname={pathname} />
    </aside>
  );
}

export function MobileSidebar({ role, userId }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-card shadow-xl lg:hidden animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="absolute right-3 top-3 z-10">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </Button>
            </div>
            <SidebarContent
              role={role}
              userId={userId}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}
