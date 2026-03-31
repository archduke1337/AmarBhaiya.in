// ── Platform Constants ──────────────────────────────────────────────────────

export const SITE_NAME = "amarbhaiya.in";
export const SITE_TAGLINE = "Learn from Bhaiya";
export const SITE_DESCRIPTION =
  "Amarnath Pandey's unified platform — Education, Fitness, Career Guidance, Entrepreneurship & Personal Development.";

export const OWNER = {
  name: "Amarnath Pandey",
  shortName: "Amar Bhaiya",
  email: "contact@amarbhaiya.in",
  roles: [
    { title: "Tech Expert", icon: "code", color: "from-blue-500 to-cyan-400" },
    { title: "Fitness Trainer", icon: "dumbbell", color: "from-emerald-500 to-green-400" },
    { title: "Career Coach", icon: "compass", color: "from-violet-500 to-purple-400" },
    { title: "Entrepreneur", icon: "rocket", color: "from-orange-500 to-amber-400" },
    { title: "Life Mentor", icon: "heart", color: "from-rose-500 to-pink-400" },
  ],
  social: {
    youtube: "https://youtube.com/@amarbhaiya",
    instagram: "https://instagram.com/amarbhaiya",
    linkedin: "https://linkedin.com/in/amarnathpandey",
    twitter: "https://twitter.com/amarbhaiya",
  },
} as const;

// ── Navigation ──────────────────────────────────────────────────────────────

export const PUBLIC_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const DASHBOARD_NAV_ITEMS = {
  student: [
    { label: "Dashboard", href: "/app/dashboard", icon: "layout-dashboard" },
    { label: "My Courses", href: "/app/courses", icon: "book-open" },
    { label: "Community", href: "/app/community", icon: "users" },
    { label: "Live Sessions", href: "/app/live", icon: "video" },
    { label: "Profile", href: "/app/profile", icon: "user" },
  ],
  instructor: [
    { label: "Dashboard", href: "/instructor", icon: "layout-dashboard" },
    { label: "My Courses", href: "/instructor/courses", icon: "book-open" },
    { label: "Students", href: "/instructor/students", icon: "users" },
    { label: "Live Sessions", href: "/instructor/live", icon: "video" },
    { label: "Community", href: "/instructor/community", icon: "message-square" },
  ],
  moderator: [
    { label: "Dashboard", href: "/moderator", icon: "layout-dashboard" },
    { label: "Reports", href: "/moderator/reports", icon: "flag" },
    { label: "Students", href: "/moderator/students", icon: "users" },
    { label: "Community", href: "/moderator/community", icon: "message-square" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "layout-dashboard" },
    { label: "Users", href: "/admin/users", icon: "users" },
    { label: "Courses", href: "/admin/courses", icon: "book-open" },
    { label: "Categories", href: "/admin/categories", icon: "folder" },
    { label: "Payments", href: "/admin/payments", icon: "credit-card" },
    { label: "Live Sessions", href: "/admin/live", icon: "video" },
    { label: "Moderation", href: "/admin/moderation", icon: "shield" },
    { label: "Audit Logs", href: "/admin/audit", icon: "file-text" },
  ],
} as const;

// ── Course Access Models ────────────────────────────────────────────────────

export const ACCESS_MODELS = {
  free: { label: "Free", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  paid: { label: "Paid", color: "text-amber-500", bgColor: "bg-amber-500/10" },
  subscription: { label: "Premium", color: "text-violet-500", bgColor: "bg-violet-500/10" },
} as const;

// ── Role Configuration ──────────────────────────────────────────────────────

export const ROLES = {
  admin: { label: "Admin", color: "text-red-500", bgColor: "bg-red-500/10", showBadge: false },
  instructor: { label: "Instructor", color: "text-blue-500", bgColor: "bg-blue-500/10", showBadge: true },
  moderator: { label: "Moderator", color: "text-purple-500", bgColor: "bg-purple-500/10", showBadge: true },
  student: { label: "Student", color: "text-emerald-500", bgColor: "bg-emerald-500/10", showBadge: true },
} as const;

export type Role = keyof typeof ROLES;
