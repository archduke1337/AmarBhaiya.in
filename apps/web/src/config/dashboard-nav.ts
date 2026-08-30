import {
  Bell,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileText,
  Flag,
  Folder,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Repeat,
  Shield,
  Tag,
  TrendingUp,
  Trophy,
  UserCheck,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import type { Role } from "@/lib/utils/constants";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  matchPrefixes?: string[];
};

export function getNavItems(role: Role, userId: string): NavItem[] {
  if (role === "admin") {
    return [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
      { label: "Blog", href: "/admin/blog", icon: FileText },
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
      { label: "Coupons", href: "/instructor/coupons", icon: Tag },
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
    { label: "Notes", href: "/app/notes", icon: FileText, matchPrefixes: ["/app/notes"] },
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

export function getWorkspaceCopy(role: Role): string {
  if (role === "admin") {
    return "Run the platform, review operational alerts, and oversee users, content, and revenue.";
  }
  if (role === "instructor") {
    return "Manage your courses, resources, students, submissions, and live sessions from one place.";
  }
  if (role === "moderator") {
    return "Review reports, moderate community threads, and keep track of active sanctions.";
  }
  return "Move between notes, courses, assignments, and live sessions without losing your place or your study rhythm.";
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) {
    return true;
  }
  if (item.exact) {
    return false;
  }
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) => pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}?`) || pathname.startsWith(`${prefix}#`)
  );
}

export function getBottomTabItems(role: Role, userId: string) {
  if (role === "admin") {
    return [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, match: (p: string) => p === "/admin" },
      { label: "Users", href: "/admin/users", icon: Users, match: (p: string) => p.startsWith("/admin/users") },
      { label: "Courses", href: "/admin/courses", icon: BookOpen, match: (p: string) => p.startsWith("/admin/courses") },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, match: (p: string) => p.startsWith("/admin/payments") },
    ];
  }
  if (role === "instructor") {
    return [
      { label: "Dashboard", href: "/instructor", icon: LayoutDashboard, match: (p: string) => p === "/instructor" },
      { label: "Courses", href: "/instructor/courses", icon: BookOpen, match: (p: string) => p.startsWith("/instructor/courses") },
      { label: "Students", href: "/instructor/students", icon: Users, match: (p: string) => p.startsWith("/instructor/students") },
      { label: "Submissions", href: "/instructor/submissions", icon: ClipboardCheck, match: (p: string) => p.startsWith("/instructor/submissions") },
    ];
  }
  if (role === "moderator") {
    return [
      { label: "Dashboard", href: "/moderator", icon: LayoutDashboard, match: (p: string) => p === "/moderator" },
      { label: "Reports", href: "/moderator/reports", icon: Flag, match: (p: string) => p.startsWith("/moderator/reports") },
      { label: "Students", href: "/moderator/students", icon: Users, match: (p: string) => p.startsWith("/moderator/students") },
      { label: "Community", href: "/moderator/community", icon: MessageSquare, match: (p: string) => p.startsWith("/moderator/community") },
    ];
  }
  return [
    { label: "Home", href: "/app/dashboard", icon: LayoutDashboard, match: (p: string) => p === "/app/dashboard" },
    { label: "Courses", href: "/app/courses", icon: BookOpen, match: (p: string) => p.startsWith("/app/courses") || p.startsWith("/app/learn") },
    { label: "Notes", href: "/app/notes", icon: FileText, match: (p: string) => p.startsWith("/app/notes") },
    { label: "Profile", href: `/app/profile/${userId}`, icon: UserRound, match: (p: string) => p.startsWith("/app/profile") },
  ];
}
