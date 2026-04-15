// ── Platform Constants ──────────────────────────────────────────────────────

export const SITE_NAME = "amarbhaiya.in";
export const SITE_TAGLINE = "Padhai, Skills, aur Zindagi — Bhaiya ke saath";
export const SITE_DESCRIPTION =
  "Class 6 to 12 board exams, competitive prep, coding, career skills & personal growth — guided by Amarnath Pandey (Amar Bhaiya). Free notes, video courses, live sessions & community support.";

export const OWNER = {
  name: "Amarnath Pandey",
  shortName: "Amar Bhaiya",
  email: "contact@amarbhaiya.in",
  roles: [
    { title: "Educator", icon: "book-open" },
    { title: "Mentor", icon: "heart" },
    { title: "Career Guide", icon: "compass" },
    { title: "Tech Instructor", icon: "code" },
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
  { label: "Courses", href: "/courses" },
  { label: "Notes", href: "/notes" },
  { label: "About", href: "/about" },
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

export const ROLES = {
  admin: { label: "Admin", showBadge: false },
  instructor: { label: "Instructor", showBadge: true },
  moderator: { label: "Moderator", showBadge: true },
  student: { label: "Student", showBadge: false },
} as const;

export type Role = keyof typeof ROLES;

// ── Class/Grade Configuration ───────────────────────────────────────────────

export const CLASS_GRADES = [
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11-science", label: "Class 11 (Science)" },
  { value: "11-commerce", label: "Class 11 (Commerce)" },
  { value: "12-science", label: "Class 12 (Science)" },
  { value: "12-commerce", label: "Class 12 (Commerce)" },
] as const;

export const SKILL_CATEGORIES = [
  { value: "coding", label: "Coding & Tech" },
  { value: "career", label: "Career & Interviews" },
  { value: "communication", label: "Communication" },
  { value: "finance", label: "Personal Finance" },
  { value: "fitness", label: "Health & Fitness" },
] as const;
