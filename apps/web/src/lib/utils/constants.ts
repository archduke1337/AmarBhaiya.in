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
    youtube: "https://www.youtube.com/@amarxbhaiya",
    instagram: "https://www.instagram.com/amarxbhaiya/",
    whatsapp: "https://www.whatsapp.com/channel/0029VbCE7cbDDmFVAQzuXI3n",
    linkedin: "https://www.linkedin.com/in/amarnath-pandey-3aab561b7/",
  },
} as const;

// ── Navigation ──────────────────────────────────────────────────────────────

export const PUBLIC_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Notes", href: "/notes" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

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
