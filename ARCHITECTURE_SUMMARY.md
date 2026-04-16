# 🏗️ ARCHITECTURE DIAGRAMS

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AmarBhaiya.in Platform                          │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND (React 19 + Next.js)    →  BACKEND (Appwrite + Node)
├── Pages (TSX)                      ├── TablesDB (Postgres)
├── Components (shadcn/ui)           ├── Storage (Files)
├── Themes (Dark/Light)              ├── Auth (OAuth 2.0)
├── Animations (Framer)              ├── Functions (Webhooks)
└── Client Logic                     └── Security (API Keys)
```

## 2. DATABASE SCHEMA

```
COURSE HIERARCHY:
┌────────────┐
│ Category   │
└────┬───────┘
     │
     ├─ Course
     │   ├─ Module 
     │   │   └─ Lesson
     │   │       ├─ Quiz → QuizQuestion → QuizAttempt
     │   │       ├─ Assignment → Submission
     │   │       └─ Resources
     │   ├─ Enrollment
     │   └─ Certificate
     │
     └─ Progress (per lesson)

COMMUNITY:
├─ ForumCategory
│   └─ ForumThread → ForumReply
└─ CourseComment (threaded)

PAYMENTS:
├─ Payment
└─ Subscription

ADMIN:
├─ ModerationAction
├─ AuditLog
└─ Notification
```

## 3. AUTHENTICATION FLOW

```
User Registration
  ↓
Appwrite Account API (create user)
  ↓
Email Verification Link
  ↓
Session Cookie: a_session_${PROJECT_ID}
  ↓
Role Assignment via labels (admin|instructor|moderator|student)
  ↓
Protected Route Access via requireAuth() & requireRole()
```

## 4. PAYMENT FLOW (Razorpay)

```
User Clicks "Enroll"
  ↓
POST /api/payments/razorpay/create-order
  ├─ Validate enrollment
  ├─ Call Razorpay API
  └─ Return orderId
  ↓
Client: Open Razorpay Modal
  ├─ key: PUBLIC_KEY_ID
  ├─ amount: (price * 100 paise)
  └─ order_id: from response
  ↓
User Completes Payment
  ↓
Razorpay Callback
  ├─ Verify Webhook Signature (HMAC-SHA256)
  ├─ Create Enrollment record
  ├─ Create Payment record
  ├─ Send Confirmation Email
  └─ Redirect to Course
```

## 5. COMPONENT COMPOSITION

```
Button (CVA Pattern):
├─ Variants: default, outline, secondary, ghost, destructive, link
├─ Sizes: xs, sm, default, lg, icon
└─ States: hover, focus, active, disabled, aria-invalid

Theme Provider:
├─ Light/Dark/System modes
├─ localStorage persistence
├─ matchMedia listener
└─ DOM class: "dark" or data-theme

Dashboard Components:
├─ StatCard (with trends)
├─ PageHeader (breadcrumbs)
├─ ActivityFeed (timeline)
└─ EmptyState (fallback UI)
```

## 6. ROLE-BASED DASHBOARDS

```
User Role Check (via labels)
  ↓
  ├─ admin → /admin
  │   ├─ Users Management
  │   ├─ Content Approval
  │   ├─ Payments
  │   └─ Audit Logs
  │
  ├─ instructor → /instructor
  │   ├─ My Courses
  │   ├─ Student Submissions
  │   └─ Earnings
  │
  ├─ moderator → /moderator
  │   ├─ Reports
  │   └─ Community Moderation
  │
  └─ student → /app/dashboard
      ├─ Active Courses
      ├─ Progress
      └─ Billing
```

## 7. ERROR HANDLING

```
Error Occurs
  ↓
Categorize: VALIDATION|AUTH|AUTHZ|NOT_FOUND|CONFLICT|
            RATE_LIMIT|EXTERNAL|DATABASE|INTERNAL
  ↓
Log with Context (userId, action, resource, details)
  ↓
Production: Send to Sentry/DataDog (TODO)
Development: Log to console with stack trace
  ↓
Generate Safe Message (never expose internals)
  ↓
Return to Client
```

## 8. COURSE PROGRESS TRACKING

```
Student Watches Lesson
  ↓
markLessonComplete() triggered
  ↓
Server Action: recordProgress()
  ├─ Verify enrollment
  ├─ Create Progress record
  └─ Calculate overall %
  ↓
Is completion >= 80%?
  ├─ YES: Generate Certificate
  │   └─ Send Email + Create Notification
  └─ NO: Update Progress record
```

## 9. VALIDATION CHAIN

```
User Input (Form)
  ↓
Client-side validation (optional, UX)
  ↓
Server Action receives FormData/JSON
  ↓
Zod Schema Validation (/src/lib/validators/)
  ├─ Type: z.object() / z.string().min().max()
  └─ Error: Validation category
  ↓
Business Logic Validation (permissions, conflicts)
  ↓
Database Constraints enforced
  ↓
Response with success/error
```

## 10. TECHNOLOGY STACK

```
Frontend:       React 19.2.4, Next.js 16.2.1, TypeScript 5
UI/Styling:     Tailwind CSS 4, shadcn/ui, CVA, Radix UI
Animations:     Framer Motion 12, Motion 12
Icons:          Lucide React 1.7
3D Graphics:    Three.js 0.183, React Three Fiber 9.5
Backend:        Node.js, Server Actions, API Routes
Database:       Appwrite TablesDB (PostgreSQL)
Authentication: Appwrite Account API + Cookies
Payments:       Razorpay (India)
Real-time:      Stream Chat 9.39
Validation:     Zod 4.3
Utilities:      date-fns, clsx, tailwind-merge
Testing:        Vitest 3.2
Quality:        ESLint 9, TypeScript strict mode
```

---

## KEY METRICS

```
Tables (Collections): 28
Storage Buckets: 7
User Roles: 4 (admin, instructor, moderator, student)
API Routes: 14 endpoints across 11 route groups
Pages/Routes: ~50 (marketing+auth+student+instructor+moderator+admin)
Components: 35+
Server Actions: 19 files
Validation Schemas: Zod (auth + course)
```

---

## MIDDLEWARE

```
src/middleware.ts          ← Next.js entry point (re-exports proxy)
src/proxy.ts               ← All routing logic lives here

Middleware does:
  1. Community subdomain rewrite (community.amarbhaiya.in → /app/community)
  2. Protected route auth check (/app /instructor /moderator /admin)
     - Session validation cached 15 s in-process (max 500 entries)
     - Cold starts always do a fresh Appwrite check (Map resets)
  3. Auth route redirect for already-logged-in users
  4. Parallel cache: prune expired entries on every cache write
```

---

## CHANGELOG (fixes applied Apr 2026)

| # | Fix | File(s) |
|---|-----|---------|
| 1 | **Created `src/middleware.ts`** — without this file Next.js never ran any of the routing/auth logic in proxy.ts | `src/middleware.ts` (new) |
| 2 | **Tightened session cache** — TTL 30s→15s, 500-entry cap, prune on write, 3s on network failure | `src/proxy.ts` |
| 3 | **Rewrote `hero-digital-success.tsx`** — removed wrong "UI-Layouts" agency branding, replaced with AmarBhaiya content; lazy-loaded ShaderGradient/Three.js via `next/dynamic({ssr:false})` | `src/components/hero-digital-success.tsx` |
| 4 | **Added dashboard-data barrel** — `src/lib/appwrite/dashboard-data/index.ts` re-exports all 50+ symbols; enables future incremental splitting without breaking imports | `src/lib/appwrite/dashboard-data/index.ts` (new) |
| 5 | **Marked dashboard-data.ts as deprecated** — JSDoc `@deprecated` comment guides new code toward the barrel | `src/lib/appwrite/dashboard-data.ts` |
| 6 | **Verified `@emailjs/browser`** — confirmed it is only imported in `contact-form.tsx` which has `"use client"` ✅ | `src/app/(marketing)/contact/contact-form.tsx` |

