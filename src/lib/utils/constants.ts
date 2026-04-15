// ── Platform Constants ──────────────────────────────────────────────────────

export const SITE_NAME = "amarbhaiya.in";
export const SITE_TAGLINE = "Learn from Bhaiya";
export const SITE_DESCRIPTION =
  "Amar Bhaiya's learning platform for Class 6 to 12 students first, with notes, courses, and practical guidance that later expands into skills, career, and life growth.";

export const OWNER = {
  name: "Amarnath Pandey",
  shortName: "Amar Bhaiya",
  email: "contact@amarbhaiya.in",
  roles: [
    { title: "Tech Expert", icon: "code" },
    { title: "Fitness Trainer", icon: "dumbbell" },
    { title: "Career Coach", icon: "compass" },
    { title: "Entrepreneur", icon: "rocket" },
    { title: "Life Mentor", icon: "heart" },
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
  { label: "Notes", href: "/notes" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const DASHBOARD_NAV_ITEMS = {
  student: [
    { label: "Dashboard", href: "/app/dashboard", icon: "layout-dashboard" },
    { label: "My Courses", href: "/app/courses", icon: "book-open" },
    { label: "Assignments", href: "/app/assignments", icon: "file-text" },
    { label: "Community", href: "/app/community", icon: "users" },
    { label: "Live Sessions", href: "/app/live", icon: "video" },
    { label: "Notifications", href: "/app/notifications", icon: "bell" },
    { label: "Profile", href: "/app/profile/edit", icon: "user" },
    { label: "Billing", href: "/app/billing", icon: "credit-card" },
  ],
  instructor: [
    { label: "Dashboard", href: "/instructor", icon: "layout-dashboard" },
    { label: "My Courses", href: "/instructor/courses", icon: "book-open" },
    { label: "Resources", href: "/instructor/resources", icon: "file-text" },
    { label: "Categories", href: "/instructor/categories", icon: "folder" },
    { label: "Students", href: "/instructor/students", icon: "users" },
    { label: "Submissions", href: "/instructor/submissions", icon: "clipboard-check" },
    { label: "Live Sessions", href: "/instructor/live", icon: "video" },
    { label: "Earnings", href: "/instructor/earnings", icon: "trending-up" },
  ],
  moderator: [
    { label: "Dashboard", href: "/moderator", icon: "layout-dashboard" },
    { label: "Reports", href: "/moderator/reports", icon: "flag" },
    { label: "Students", href: "/moderator/students", icon: "users" },
    { label: "Community", href: "/moderator/community", icon: "message-square" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: "layout-dashboard" },
    { label: "Marketing", href: "/admin/marketing", icon: "megaphone" },
    { label: "Users", href: "/admin/users", icon: "users" },
    { label: "Student Data", href: "/admin/students", icon: "graduation-cap" },
    { label: "Instructors", href: "/admin/instructors", icon: "user-check" },
    { label: "Courses", href: "/admin/courses", icon: "book-open" },
    { label: "Categories", href: "/admin/categories", icon: "folder" },
    { label: "Payments", href: "/admin/payments", icon: "credit-card" },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: "repeat" },
    { label: "Live Sessions", href: "/admin/live", icon: "video" },
    { label: "Moderation", href: "/admin/moderation", icon: "shield" },
    { label: "Notifications", href: "/admin/notifications", icon: "bell" },
    { label: "Audit Logs", href: "/admin/audit", icon: "file-text" },
  ],
} as const;

// ── Course Access Models ────────────────────────────────────────────────────

export const ACCESS_MODELS = {
  free: { label: "Free" },
  paid: { label: "Paid" },
  subscription: { label: "Premium" },
} as const;

// ── Role Configuration ──────────────────────────────────────────────────────
// Monochrome — no color badges, using border/text contrast instead.

export const ROLES = {
  admin: { label: "Admin", showBadge: false },
  instructor: { label: "Instructor", showBadge: true },
  moderator: { label: "Moderator", showBadge: true },
  student: { label: "Student", showBadge: false },
} as const;

export type Role = keyof typeof ROLES;
