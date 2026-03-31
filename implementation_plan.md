# amarbhaiya.in — Master Implementation Plan

> **Stack**: Next.js 16.2.1 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Appwrite (self-hosted) · Stream · Razorpay · PhonePe · EmailJS · Vercel
>
> **Target**: 90-day MVP · 12 phases · ~500 initial students

---

## Current State

| Aspect | Status |
|--------|--------|
| Next.js 16 project | ✅ Scaffolded with `create-next-app`, boilerplate code in place |
| Tailwind CSS v4 | ✅ Installed via `@tailwindcss/postcss`, using `@import "tailwindcss"` |
| TypeScript | ✅ Configured with `@/*` path alias → `./src/*` |
| App Router | ✅ Using `src/app/` directory |
| `.env` | ✅ Template with all keys (Appwrite, Stream, Razorpay, PhonePe, EmailJS) |
| Appwrite SDK | ❌ Not installed |
| UI Libraries | ❌ Not installed (HeroUI, Shadcn, MagicUI, SkiperUI) |
| Route structure | ❌ Only root page exists |
| Auth system | ❌ Not implemented |
| Database schema | ❌ Not created in Appwrite |

---

## Directory Structure (Target)

```
src/
├── app/
│   ├── (public)/                    # Route group: public pages
│   │   ├── layout.tsx               # Public layout (navbar + footer)
│   │   ├── page.tsx                 # Landing page (/)
│   │   ├── about/page.tsx           # About page
│   │   ├── courses/
│   │   │   ├── page.tsx             # Course catalogue
│   │   │   └── [slug]/page.tsx      # Course detail
│   │   ├── blog/
│   │   │   ├── page.tsx             # Blog listing
│   │   │   └── [slug]/page.tsx      # Blog post
│   │   └── contact/page.tsx         # Contact form
│   │
│   ├── (auth)/                      # Route group: auth pages
│   │   ├── layout.tsx               # Centered auth layout
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (dashboard)/                 # Route group: authenticated area
│   │   ├── layout.tsx               # Dashboard shell (sidebar + header)
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx   # Student dashboard
│   │   │   ├── courses/
│   │   │   │   └── [id]/page.tsx    # Course player
│   │   │   ├── community/page.tsx   # Global forums
│   │   │   └── profile/
│   │   │       └── [id]/page.tsx    # Public user profile
│   │   │
│   │   ├── instructor/
│   │   │   ├── page.tsx             # Instructor dashboard
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx         # My courses list
│   │   │   │   ├── new/page.tsx     # Create course
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # Edit course
│   │   │   │       └── curriculum/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   └── live/page.tsx
│   │   │
│   │   ├── moderator/
│   │   │   ├── page.tsx             # Moderator dashboard
│   │   │   ├── reports/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   └── community/page.tsx
│   │   │
│   │   └── admin/
│   │       ├── page.tsx             # Admin dashboard
│   │       ├── users/page.tsx
│   │       ├── courses/page.tsx
│   │       ├── categories/page.tsx
│   │       ├── payments/page.tsx
│   │       ├── live/page.tsx
│   │       ├── moderation/page.tsx
│   │       └── audit/page.tsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── oauth/route.ts
│   │   ├── payments/
│   │   │   ├── razorpay/
│   │   │   │   ├── create-order/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   └── phonepe/
│   │   │       ├── create-order/route.ts
│   │   │       └── webhook/route.ts
│   │   └── stream/
│   │       └── token/route.ts
│   │
│   ├── layout.tsx                   # Root layout
│   ├── globals.css                  # Global styles + design tokens
│   ├── not-found.tsx
│   └── error.tsx
│
├── lib/
│   ├── appwrite/
│   │   ├── config.ts                # Appwrite constants (DB IDs, collection IDs, bucket IDs)
│   │   ├── server.ts                # Server SDK: createAdminClient(), createSessionClient()
│   │   ├── client.ts                # Client SDK: for realtime subscriptions
│   │   └── auth.ts                  # getLoggedInUser(), getUserRole(), requireRole()
│   │
│   ├── stream/
│   │   └── client.ts                # Stream Video + Chat client init
│   │
│   ├── payments/
│   │   ├── razorpay.ts              # Razorpay SDK wrapper
│   │   └── phonepe.ts               # PhonePe API wrapper
│   │
│   ├── email/
│   │   └── emailjs.ts               # EmailJS config
│   │
│   ├── utils/
│   │   ├── cn.ts                    # className merger
│   │   ├── format.ts                # Date, currency formatters
│   │   └── constants.ts             # Platform-wide constants
│   │
│   └── validators/
│       ├── auth.ts                  # Zod schemas for auth forms
│       └── course.ts                # Zod schemas for course forms
│
├── components/
│   ├── ui/                          # Base UI primitives (Shadcn-style)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   └── ... (more primitives)
│   │
│   ├── layout/
│   │   ├── navbar.tsx               # Public navbar
│   │   ├── footer.tsx               # Public footer
│   │   ├── sidebar.tsx              # Dashboard sidebar
│   │   ├── dashboard-header.tsx     # Dashboard top bar
│   │   └── mobile-nav.tsx
│   │
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── identity-cards.tsx
│   │   ├── about-teaser.tsx
│   │   ├── featured-courses.tsx
│   │   ├── achievements.tsx
│   │   ├── testimonials.tsx
│   │   ├── live-session-cta.tsx
│   │   ├── community-preview.tsx
│   │   ├── blog-teaser.tsx
│   │   └── social-links.tsx
│   │
│   ├── course/
│   │   ├── course-card.tsx
│   │   ├── course-player.tsx
│   │   ├── lesson-sidebar.tsx
│   │   ├── video-player.tsx
│   │   ├── progress-bar.tsx
│   │   ├── quiz-renderer.tsx
│   │   └── comment-section.tsx
│   │
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── oauth-buttons.tsx
│   │   └── role-badge.tsx
│   │
│   ├── community/
│   │   ├── forum-thread.tsx
│   │   ├── forum-reply.tsx
│   │   └── forum-category.tsx
│   │
│   └── admin/
│       ├── stat-card.tsx
│       ├── data-table.tsx
│       ├── user-management.tsx
│       └── audit-log.tsx
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-appwrite.ts
│   └── use-stream.ts
│
├── actions/                         # Server Actions
│   ├── auth.ts
│   ├── courses.ts
│   ├── enrollments.ts
│   ├── forums.ts
│   ├── moderation.ts
│   └── payments.ts
│
└── types/
    ├── appwrite.ts                  # Appwrite document type interfaces
    ├── stream.ts
    └── index.ts
```

---

## Phase 1 — Foundation & Dependencies (Week 1)

> **Goal**: Install all dependencies, configure tooling, set up design system skeleton.

### 1.1 Install Core Dependencies

```bash
# Appwrite Server SDK (for SSR)
npm install node-appwrite

# Appwrite Client SDK (for realtime on client)
npm install appwrite

# UI Libraries
npx shadcn@latest init
npm install @heroui/react framer-motion
# MagicUI + SkiperUI — install as needed per component

# Utilities
npm install zod clsx tailwind-merge
npm install lucide-react  # Icons

# Payments
npm install razorpay

# Stream
npm install @stream-io/video-react-sdk @stream-io/node-sdk stream-chat stream-chat-react

# Email
npm install @emailjs/browser

# Misc
npm install server-only
npm install date-fns
```

### 1.2 Configure Tailwind v4 Design System

Update `globals.css` with the full design token system:

- **Custom colors**: Brand palette (warm orange/amber primary, dark neutrals)
- **Typography**: Import Inter / Outfit from Google Fonts
- **Spacing scale**, **Border radius**, **Shadows**
- **Dark mode** tokens via `@media (prefers-color-scheme: dark)` and class-based toggle
- **Animation keyframes**: fadeIn, slideUp, scaleIn, shimmer, etc.

### 1.3 Configure `next.config.ts`

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.appwrite.io' }, // Appwrite storage
    ],
  },
  serverExternalPackages: ['node-appwrite'],
};
```

### 1.4 Set Up Path Aliases

Already configured: `@/*` → `./src/*`

### 1.5 Create Base UI Components

Build out `src/components/ui/` with Shadcn CLI or manual implementation:
- Button, Input, Card, Badge, Avatar, Dialog, DropdownMenu, Skeleton, Tabs, Toast, Separator, Sheet

### Tasks
- [ ] Install all npm dependencies
- [ ] Configure Tailwind v4 design tokens in `globals.css`
- [ ] Update `next.config.ts` with image domains and server packages
- [ ] Initialize Shadcn UI components
- [ ] Create `src/lib/utils/cn.ts` (clsx + tailwind-merge)
- [ ] Set up Google Fonts (Inter + Outfit) in root layout
- [ ] Create base component library in `src/components/ui/`

---

## Phase 2 — Appwrite SDK Integration (Week 1-2)

> **Goal**: Establish server-side and client-side Appwrite clients, implement SSR auth pattern.

### 2.1 Appwrite Server Client (`src/lib/appwrite/server.ts`)

Following the [official Appwrite Next.js SSR pattern](https://appwrite.io/docs/tutorials/nextjs-ssr-auth/step-3):

```ts
"use server";
import { Client, Account, Databases, Storage, Users } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const cookieStore = await cookies();
  const session = cookieStore.get("amarbhaiya-session");

  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);

  return {
    get account() { return new Account(client); },
    get databases() { return new Databases(client); },
    get storage() { return new Storage(client); },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    get account() { return new Account(client); },
    get databases() { return new Databases(client); },
    get storage() { return new Storage(client); },
    get users() { return new Users(client); },
  };
}
```

> [!IMPORTANT]
> **Never share a Client instance between requests.** Each function creates a fresh instance per Appwrite's security requirements.

### 2.2 Auth Utilities (`src/lib/appwrite/auth.ts`)

```ts
export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

export async function getUserRole(user): Promise<'admin' | 'instructor' | 'moderator' | 'student'> {
  const labels = user?.labels || [];
  if (labels.includes('admin')) return 'admin';
  if (labels.includes('instructor')) return 'instructor';
  if (labels.includes('moderator')) return 'moderator';
  return 'student';
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getLoggedInUser();
  if (!user) redirect('/login');
  const role = await getUserRole(user);
  if (!allowedRoles.includes(role)) redirect('/app/dashboard');
  return { user, role };
}
```

### 2.3 Appwrite Config Constants (`src/lib/appwrite/config.ts`)

```ts
export const APPWRITE_CONFIG = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  collections: {
    courses: 'courses',
    categories: 'categories',
    modules: 'modules',
    lessons: 'lessons',
    resources: 'resources',
    enrollments: 'enrollments',
    progress: 'progress',
    quizzes: 'quizzes',
    quizQuestions: 'quiz_questions',
    quizAttempts: 'quiz_attempts',
    assignments: 'assignments',
    submissions: 'submissions',
    certificates: 'certificates',
    liveSessions: 'live_sessions',
    sessionRsvps: 'session_rsvps',
    courseComments: 'course_comments',
    forumCategories: 'forum_categories',
    forumThreads: 'forum_threads',
    forumReplies: 'forum_replies',
    payments: 'payments',
    subscriptions: 'subscriptions',
    moderationActions: 'moderation_actions',
    auditLogs: 'audit_logs',
    notifications: 'notifications',
  },
  buckets: {
    courseVideos: 'course_videos',
    courseThumbnails: 'course_thumbnails',
    courseResources: 'course_resources',
    userAvatars: 'user_avatars',
    certificates: 'certificates',
  },
} as const;
```

### Tasks
- [ ] Create `src/lib/appwrite/server.ts` — SSR client factories
- [ ] Create `src/lib/appwrite/client.ts` — browser-side client (for realtime)
- [ ] Create `src/lib/appwrite/auth.ts` — getLoggedInUser, getUserRole, requireRole
- [ ] Create `src/lib/appwrite/config.ts` — all collection/bucket IDs
- [ ] Update `.env` with `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- [ ] Test connection to Appwrite instance

---

## Phase 3 — Authentication System (Week 2)

> **Goal**: Full auth flow — register, login, logout, OAuth, password reset, RBAC enforcement.

### 3.1 Auth Route Group `(auth)/`

| Route | Page | Description |
|-------|------|-------------|
| `/login` | `(auth)/login/page.tsx` | Email/password + Google OAuth |
| `/register` | `(auth)/register/page.tsx` | Email/password signup |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Password reset via Appwrite |

### 3.2 Server Actions (`src/actions/auth.ts`)

- `signUp(formData)` — create account via `createAdminClient()`, create session, set cookie
- `signIn(formData)` — create email/password session, set cookie
- `signOut()` — delete session cookie, call `account.deleteSession('current')`
- `oauthSignIn(provider)` — redirect to OAuth flow

### 3.3 Cookie Strategy

- Cookie name: `amarbhaiya-session`
- Value: `session.secret` from Appwrite
- Options: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`, `path: '/'`

### 3.4 RBAC Middleware Pattern

Since Next.js 16 doesn't have a traditional middleware for Appwrite cookie validation (Appwrite sessions require server SDK validation), we enforce RBAC at the **layout level**:

- `(dashboard)/layout.tsx` — calls `getLoggedInUser()`, redirects to `/login` if null
- `(dashboard)/admin/layout.tsx` — calls `requireRole(['admin'])`
- `(dashboard)/instructor/layout.tsx` — calls `requireRole(['admin', 'instructor'])`
- `(dashboard)/moderator/layout.tsx` — calls `requireRole(['admin', 'moderator'])`

### 3.5 Auth UI Components

- `LoginForm` — email/password fields, validation errors, OAuth buttons
- `RegisterForm` — name, email, password, consent checkbox (DPDP)
- `OAuthButtons` — Google sign-in button
- `RoleBadge` — displays user role next to name

### Tasks
- [ ] Create `(auth)/layout.tsx` — centered auth layout
- [ ] Create `(auth)/login/page.tsx` with `LoginForm`
- [ ] Create `(auth)/register/page.tsx` with `RegisterForm`
- [ ] Create `(auth)/forgot-password/page.tsx`
- [ ] Create `src/actions/auth.ts` — all server actions
- [ ] Create `src/lib/validators/auth.ts` — Zod schemas
- [ ] Create `src/components/auth/` — LoginForm, RegisterForm, OAuthButtons, RoleBadge
- [ ] Implement RBAC in dashboard layouts
- [ ] Create API route for OAuth callback: `api/auth/oauth/route.ts`
- [ ] Test: register → login → session persistence → logout → role-gating

---

## Phase 4 — Public Site & Landing Page (Week 3-4)

> **Goal**: Build the brand-first landing page and all public routes.

### 4.1 Landing Page Sections (in order)

| # | Component | Key Content |
|---|-----------|-------------|
| 1 | `Hero` | Amarnath's photo/video, tagline "Learn from Bhaiya", CTA buttons |
| 2 | `IdentityCards` | 5 cards: Tech Expert, Fitness Trainer, Career Coach, Entrepreneur, Mentor |
| 3 | `AboutTeaser` | "Why I teach" story, mission statement |
| 4 | `FeaturedCourses` | Top 3-6 courses from Appwrite DB, with ratings and price |
| 5 | `Achievements` | Stats: students taught, courses, years experience |
| 6 | `Testimonials` | Student success stories carousel |
| 7 | `LiveSessionCTA` | Next upcoming live class with Join button |
| 8 | `CommunityPreview` | Active forum discussions teaser |
| 9 | `BlogTeaser` | Latest 3 blog posts |
| 10 | `SocialLinks` | YouTube, Instagram, LinkedIn, Twitter |
| 11 | `ContactCTA` | "Get in touch" section |

### 4.2 Public Layout

- Glassmorphic navbar with logo, navigation links, CTA button
- Dynamic navbar: shows "Login" for guests, avatar+dropdown for logged-in users
- Footer with links, social icons, legal pages, copyright

### 4.3 Course Catalogue (`/courses`)

- Grid of `CourseCard` components
- Filter by category (dynamic from Appwrite)
- Search by title
- Sort by: newest, popular, price
- Each card: thumbnail, title, instructor, rating, price, access model badge

### 4.4 Course Detail (`/courses/[slug]`)

- Hero section with course thumbnail/preview video
- Title, description, instructor info
- Curriculum accordion (modules → lessons)
- What you'll learn
- Requirements
- Reviews/ratings
- Pricing CTA: "Enroll Now" (free) or "Buy Now" (paid)
- Related courses

### 4.5 About Page (`/about`)

- Full biography and story
- All identity domains with details
- Timeline/journey
- Mission and values

### 4.6 Blog (`/blog`, `/blog/[slug]`)

- Blog listing with categories
- Individual blog post with rich text rendering
- Author info sidebar

### 4.7 Contact (`/contact`)

- EmailJS-powered contact form
- Fields: name, email, subject, message
- Auto-reply confirmation
- Social media links

### Tasks
- [ ] Create `(public)/layout.tsx` with Navbar + Footer
- [ ] Build `src/components/layout/navbar.tsx`
- [ ] Build `src/components/layout/footer.tsx`
- [ ] Build all 11 landing page sections in `src/components/landing/`
- [ ] Create `(public)/page.tsx` — compose landing page
- [ ] Create `(public)/about/page.tsx`
- [ ] Create `(public)/courses/page.tsx` — catalogue with filters
- [ ] Create `(public)/courses/[slug]/page.tsx` — course detail
- [ ] Create `(public)/blog/page.tsx` and `(public)/blog/[slug]/page.tsx`
- [ ] Create `(public)/contact/page.tsx` with EmailJS integration
- [ ] Generate hero image with `generate_image` tool
- [ ] Set up SEO metadata for all public pages
- [ ] Mobile responsive testing

---

## Phase 5 — LMS Core: Course Player & Enrollment (Week 5-6)

> **Goal**: Build the student learning experience — course player, progress tracking, enrollment.

### 5.1 Student Dashboard (`/app/dashboard`)

- **My Enrolled Courses** — grid with progress bars, "Continue" CTA
- **Upcoming Live Sessions** — RSVP status, countdown, join button
- **Recent Activity** — last watched, last quiz
- **Achievements** — badges, certificates earned
- **Announcements** — from admin/instructor

### 5.2 Course Player (`/app/courses/[id]`)

- **Video Player** — HTML5 video from Appwrite Bucket, custom controls
- **Lesson Sidebar** — curriculum tree with completion checkmarks
- **Tabs**: Content | Resources | Notes | Quiz | Comments
- **Progress Tracking** — mark lesson complete, update `progress` collection
- **Notes** — personal notes per lesson (stored in Appwrite)
- **Resources** — downloadable files linked to lesson

### 5.3 Enrollment Flow

```
Student clicks "Enroll"
  ├── Free course → Create enrollment record directly → Redirect to player
  └── Paid course → Payment flow (Phase 8) → Webhook creates enrollment
```

### 5.4 Progress Tracking

- On video complete or "Mark as Complete" → create/update `progress` document
- Calculate `percentComplete` per course
- Issue certificate when threshold reached

### Tasks
- [ ] Create `(dashboard)/layout.tsx` — sidebar + header shell
- [ ] Build `src/components/layout/sidebar.tsx` — role-aware navigation
- [ ] Build `src/components/layout/dashboard-header.tsx`
- [ ] Create `(dashboard)/app/dashboard/page.tsx`
- [ ] Create `(dashboard)/app/courses/[id]/page.tsx` — course player
- [ ] Build `src/components/course/course-player.tsx`
- [ ] Build `src/components/course/video-player.tsx`
- [ ] Build `src/components/course/lesson-sidebar.tsx`
- [ ] Build `src/components/course/progress-bar.tsx`
- [ ] Build `src/components/course/comment-section.tsx`
- [ ] Create `src/actions/enrollments.ts` — enroll, unenroll
- [ ] Create `src/actions/courses.ts` — progress tracking, notes
- [ ] Test: free enrollment → course access → progress tracking → completion

---

## Phase 6 — Admin Panel (Week 7)

> **Goal**: Full admin dashboard with user management, course management, and system controls.

### 6.1 Admin Dashboard (`/admin`)

- KPI cards: Total Users, Active Enrollments, Revenue (all-time + monthly), Active Live Sessions
- User growth chart
- Recent activity feed
- Alert system: failed payments, flagged content

### 6.2 User Management (`/admin/users`)

- DataTable with all users — name, email, role, join date, status
- Filters: by role, date range, status
- Actions: view profile, change role (assign/revoke Appwrite Labels), suspend, delete
- Uses `createAdminClient().users` for label management

### 6.3 Course Management (`/admin/courses`)

- All courses with status: published/draft/unpublished
- CRUD override on any course
- Feature courses on landing page (flag in DB)
- Manage categories

### 6.4 Category Management (`/admin/categories`)

- Dynamic course categories — create, rename, delete
- Drag-and-drop reorder

### 6.5 Payment Management (`/admin/payments`)

- All transactions table
- Revenue breakdown: by course, month, payment method
- Issue refunds
- Export reports

### 6.6 Audit Logs (`/admin/audit`)

- Searchable, filterable log of all platform actions
- Actor, action, entity, timestamp, metadata

### Tasks
- [ ] Create admin layout with `requireRole(['admin'])`
- [ ] Build `(dashboard)/admin/page.tsx` — KPI dashboard
- [ ] Build `(dashboard)/admin/users/page.tsx` — user management
- [ ] Build `(dashboard)/admin/courses/page.tsx` — course management
- [ ] Build `(dashboard)/admin/categories/page.tsx` — dynamic categories
- [ ] Build `(dashboard)/admin/payments/page.tsx` — transactions
- [ ] Build `(dashboard)/admin/audit/page.tsx` — audit logs
- [ ] Build `src/components/admin/` — StatCard, DataTable, UserManagement
- [ ] Create server actions for: user role changes, course featuring, refunds

---

## Phase 7 — Instructor & Moderator Panels (Week 7-8)

> **Goal**: Role-specific panels for content creation and community management.

### 7.1 Instructor Panel

| Route | Feature |
|-------|---------|
| `/instructor` | Dashboard: my courses, enrolled students, upcoming sessions |
| `/instructor/courses` | My courses list |
| `/instructor/courses/new` | Create course wizard |
| `/instructor/courses/[id]` | Edit course details |
| `/instructor/courses/[id]/curriculum` | Module + lesson builder |
| `/instructor/students` | Enrolled students per course |
| `/instructor/live` | Schedule + manage live sessions |

**Curriculum Builder UX:**
1. Add/reorder modules (drag-and-drop)
2. Add/reorder lessons within modules
3. Per lesson: upload video, add description, attach resources
4. Create quiz per lesson or module
5. Publish/unpublish course

### 7.2 Moderator Panel

| Route | Feature |
|-------|---------|
| `/moderator` | Dashboard: flagged content, pending reports |
| `/moderator/reports` | Flagged content review |
| `/moderator/students` | Student lookup, activity history |
| `/moderator/community` | Forum + comment moderation |

**Moderation Actions:**
- Warn, Mute (time-limited), Timeout (course/platform), Delete post, Pin post
- Remove from live chat
- Flag for admin review
- All actions logged to `moderation_actions` collection

### Tasks
- [ ] Create instructor layout with `requireRole(['admin', 'instructor'])`
- [ ] Build instructor dashboard, course list, course creation wizard
- [ ] Build curriculum builder (modules + lessons + video upload)
- [ ] Build student management view (per-course enrollment list)
- [ ] Create moderator layout with `requireRole(['admin', 'moderator'])`
- [ ] Build moderator dashboard, reports view, student lookup
- [ ] Build moderation action dialogs (warn, mute, timeout, delete)
- [ ] Create `src/actions/moderation.ts` — moderation CRUD + audit logging
- [ ] Test: instructor creates course → publishes → student enrolls

---

## Phase 8 — Payments: Razorpay + PhonePe (Week 9)

> **Goal**: Implement payment flows for course purchases.

### 8.1 Razorpay Integration

**Flow:**
1. Student clicks "Buy Now"
2. Frontend calls `POST /api/payments/razorpay/create-order` (Next.js Route Handler)
3. Route handler creates Razorpay order via server SDK
4. Frontend opens Razorpay Checkout modal
5. On success, Razorpay fires webhook to `POST /api/payments/razorpay/webhook`
6. Webhook: verify signature → create enrollment → send confirmation email
7. Student redirected to course player

**Webhook Route Handler:**
```ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  // Verify signature with RAZORPAY_KEY_SECRET
  // Parse body, create enrollment in Appwrite
  // Send email via Appwrite Messaging
  return Response.json({ status: 'ok' });
}
```

### 8.2 PhonePe Integration

Similar flow but using PhonePe Business API:
1. Create payment request via PhonePe API
2. Redirect to PhonePe checkout
3. Webhook callback on success
4. Verify, enroll, notify

### 8.3 Payment Records

Every payment creates a document in `payments` collection:
- userId, courseId, amount, currency, method (razorpay/phonepe), status, providerRef, createdAt

### Tasks
- [ ] Create `src/lib/payments/razorpay.ts` — server SDK wrapper
- [ ] Create `src/lib/payments/phonepe.ts` — API wrapper
- [ ] Build `api/payments/razorpay/create-order/route.ts`
- [ ] Build `api/payments/razorpay/webhook/route.ts`
- [ ] Build `api/payments/phonepe/create-order/route.ts`
- [ ] Build `api/payments/phonepe/webhook/route.ts`
- [ ] Build checkout UI components (payment method selection, processing states)
- [ ] Create `src/actions/payments.ts` — enrollment creation post-payment
- [ ] Test: end-to-end purchase flow (test mode)

---

## Phase 9 — Live Classes: Stream Video + Chat (Week 9-10)

> **Goal**: Instructor broadcasts, students watch, real-time chat during sessions.

### 9.1 Stream Setup

- **Stream Video SDK**: Instructor goes live, students join as viewers
- **Stream Chat SDK**: YouTube-style live chat (active only during sessions)

### 9.2 Token Generation (`api/stream/token/route.ts`)

```ts
export async function GET(request: Request) {
  const user = await getLoggedInUser();
  // Generate Stream token for authenticated user
  const streamClient = new StreamClient(apiKey, apiSecret);
  const token = streamClient.createToken(user.$id);
  return Response.json({ token });
}
```

### 9.3 Live Session Workflow

1. **Instructor schedules** → create `live_sessions` document + Stream call
2. **Students RSVP** → create `session_rsvps` document
3. **Dashboard shows** upcoming sessions with countdown
4. **Go Live** → instructor starts Stream Video broadcast
5. **Students join** → viewer mode + Stream Chat overlay
6. **After session** → recording URL saved to `live_sessions` document

### 9.4 Chat Rules

- Only enrolled students + moderators + instructor can chat
- Moderators can remove users from chat
- Chat is NOT persistent — only active during live sessions

### Tasks
- [ ] Set up Stream project (Video + Chat) at getstream.io
- [ ] Create `src/lib/stream/client.ts` — client initialization
- [ ] Build `api/stream/token/route.ts` — token generation
- [ ] Build live session scheduling UI (instructor panel)
- [ ] Build live session viewer page (student view)
- [ ] Build live chat overlay component
- [ ] Create RSVP system
- [ ] Test: schedule → go live → students watch + chat

---

## Phase 10 — Community & Forums (Week 10)

> **Goal**: Two-tier community — course comments + global forums.

### 10.1 Course Comments

- Per-lesson comment section
- Threaded replies (2 levels)
- Role badges next to names
- Instructors/moderators can pin, delete
- Students can react (like) and reply

### 10.2 Global Community Forums

- GitHub Discussions style
- Categories managed by admin
- Any registered user can create threads/replies
- Moderation tools (pin, delete, warn, mute)
- Role badges visible everywhere

### Tasks
- [ ] Build `src/components/course/comment-section.tsx`
- [ ] Build `(dashboard)/app/community/page.tsx` — forum index
- [ ] Build forum category view, thread view, reply system
- [ ] Build `src/components/community/` — ForumThread, ForumReply, ForumCategory
- [ ] Create `src/actions/forums.ts` — CRUD for threads, replies, moderation
- [ ] Integrate role badges in all community areas
- [ ] Test: student posts → moderator moderates → instructor reverts

---

## Phase 11 — Assessments, Certificates & Email (Week 11)

> **Goal**: Quizzes, assignments, certificates, transactional email.

### 11.1 Assessment System

- **MCQ Quiz** — auto-graded, instant feedback
- **True/False** — simple binary
- **Short Answer** — manually graded by instructor
- **Assignments** — file upload, instructor review
- **Final Exam** — timed quiz gating certificate

### 11.2 Certificates

- Auto-generated on course completion (configurable threshold)
- Stored in Appwrite Bucket
- Sent via Appwrite Messaging (email)
- Publicly shareable via unique URL
- Displayed on student profile

### 11.3 EmailJS Contact Form

- Contact form sends email via EmailJS
- Auto-reply to sender
- Fields: name, email, subject, message

### 11.4 Appwrite Messaging

- Enrollment confirmations
- Payment receipts
- Certificate delivery
- Password reset emails

### Tasks
- [ ] Build quiz creation UI (instructor panel)
- [ ] Build `src/components/course/quiz-renderer.tsx` — quiz taking experience
- [ ] Build assignment submission UI
- [ ] Create certificate generation logic (Appwrite Function or server-side)
- [ ] Build certificate view page with shareable URL
- [ ] Configure EmailJS templates and integrate contact form
- [ ] Set up Appwrite Messaging for transactional emails
- [ ] Test: quiz → score → certificate → email delivery

---

## Phase 12 — Polish, QA & Launch (Week 12)

> **Goal**: Security audit, performance optimization, final testing, deploy.

### 12.1 Security Checklist

- [ ] HTTPS enforced via Vercel
- [ ] Appwrite API keys never in client bundle (server-only)
- [ ] Payment webhook signatures verified
- [ ] Stream API keys in environment variables
- [ ] All form inputs validated (Zod)
- [ ] RBAC tested on every protected route
- [ ] Audit logging for all sensitive actions
- [ ] DPDP Act compliance: consent, privacy policy, data deletion

### 12.2 Performance

- [ ] Image optimization with Next.js `<Image />`
- [ ] Code splitting via dynamic imports
- [ ] Loading skeletons for all data-fetching pages
- [ ] Error boundaries for all route segments
- [ ] Vercel Analytics integration

### 12.3 SEO

- [ ] `metadata` exports on every page
- [ ] Open Graph images
- [ ] `sitemap.ts` and `robots.ts` files
- [ ] Semantic HTML throughout

### 12.4 Deployment

- [ ] Vercel project connected to GitHub
- [ ] All environment variables set in Vercel
- [ ] Appwrite instance live and configured (India region)
- [ ] Custom domain configured
- [ ] Final smoke test on production

### Tasks
- [ ] Security audit (all items above)
- [ ] Performance testing and optimization
- [ ] Build `src/app/not-found.tsx` and `src/app/error.tsx`
- [ ] Add loading.tsx files for all route groups
- [ ] SEO metadata for all pages
- [ ] Create sitemap.ts and robots.ts
- [ ] Deploy to Vercel
- [ ] DNS + custom domain setup
- [ ] Final end-to-end testing
- [ ] 🚀 **LAUNCH**

---

## Appwrite Database Schema — Collection Setup

> [!NOTE]
> These collections need to be created in your Appwrite Console before data operations work. Each collection needs appropriate permissions set via Appwrite Labels.

### Permission Pattern

| Collection | Read | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| `courses` | `any` (published only via query) | `label:admin`, `label:instructor` | `label:admin`, owner instructor | `label:admin`, owner instructor |
| `enrollments` | Owner user, `label:admin`, course instructor | `label:admin` (via webhook) | `label:admin` | `label:admin` |
| `progress` | Owner user, `label:admin`, course instructor | Owner user | Owner user | `label:admin` |
| `course_comments` | Enrolled users | Enrolled users | Owner, `label:admin` | Owner, `label:admin`, `label:moderator` |
| `forum_threads` | `users` (all logged in) | `users` | Owner, `label:admin` | Owner, `label:admin`, `label:moderator` |
| `payments` | Owner user, `label:admin` | `label:admin` (server-side) | `label:admin` | Never |
| `moderation_actions` | `label:admin`, `label:moderator` | `label:admin`, `label:moderator` | `label:admin` | `label:admin` |
| `audit_logs` | `label:admin` | `label:admin` (server-side) | Never | Never |

---

## Immediate Next Steps

> [!IMPORTANT]
> **Before I start coding, I need answers to these questions:**

1. **Appwrite Instance**: Is your self-hosted Appwrite instance set up and accessible? Do you have the endpoint URL, project ID, and API key ready?

2. **Design Direction**: The PRD mentions "bold, modern" design. Any specific references/sites you want the design to feel like? Any brand colors decided?

3. **Amarnath's Assets**: Do you have photos/headshots of Amarnath ready for the hero section, or should I use placeholder images initially?

4. **UI Library Priority**: The PRD lists HeroUI + Shadcn + MagicUI + SkiperUI. Should I start with **Shadcn as the base** and layer in HeroUI/MagicUI for animations? Or do you have a preference?

5. **Phase Priority**: Should I start with **Phase 1 + 2** (foundation + Appwrite SDK) first, or jump to **Phase 4** (landing page) for visual progress?

6. **Stream Account**: Is the Stream (getstream.io) account set up with Video + Chat enabled?
