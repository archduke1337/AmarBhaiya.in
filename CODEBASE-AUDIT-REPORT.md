# AmarBhaiya.in — Comprehensive Codebase Audit Report

**Date:** July 12, 2026
**Analyst:** MiMoCode Deep Analysis
**Scope:** Full codebase analysis — architecture, security, UI/UX, actions, Appwrite, SEO, performance, code quality
**Files Analyzed:** 150+ source files across `src/`, config, CI/CD, and build tooling

---

## Executive Summary

AmarBhaiya.in is a **Next.js 16 + Appwrite** edtech platform serving Class 6-12 students. It has 4 user roles (admin, instructor, moderator, student), ~90 server actions, 25+ API routes, and a well-structured route group architecture. The codebase is **notably clean** — zero console.log artifacts, genuine Hinglish copywriting (not AI slop), and solid security foundations. However, it has **significant structural issues** that need addressing before scaling.

**Overall Health: 6.5/10**

| Category | Score | Key Issue |
|----------|-------|-----------|
| Architecture | 7/10 | Dual UI libraries, proxy.ts location |
| Security | 7/10 | Missing rate limits, email enumeration |
| UI/UX | 5/10 | Two competing design systems |
| Code Quality | 6/10 | AnyRow redefined 36x, duplicated helpers |
| SEO | 4/10 | No structured data, no OG images, no canonicals |
| Performance | 6/10 | No code splitting, dead dependencies |
| Testing | 4/10 | 14 test files for 150+ source files |
| Actions | 7/10 | Missing try-catch, naming bugs |

---

## Table of Contents

1. [Architecture & File Structure](#1-architecture--file-structure)
2. [Security & Auth](#2-security--auth)
3. [UI/UX & Components](#3-uiux--components)
4. [Server Actions & Form Wrappers](#4-server-actions--form-wrappers)
5. [Appwrite Integration](#5-appwrite-integration)
6. [SEO & Marketing](#6-seo--marketing)
7. [Performance & CSS](#7-performance--css)
8. [Code Quality & AI Slop](#8-code-quality--ai-slop)
9. [Testing & CI/CD](#9-testing--cicd)
10. [Critical Fixes Checklist](#10-critical-fixes-checklist)

---

## 1. Architecture & File Structure

### Route Tree

```
src/app/
├── (auth)/           — Login, register, forgot/reset password, email verify
├── (dashboard)/
│   ├── admin/        — 16 admin pages (users, courses, payments, blog, marketing CMS, etc.)
│   ├── instructor/   — 11 instructor pages (courses, resources, submissions, earnings, etc.)
│   ├── moderator/    — 4 moderator pages (reports, community, students)
│   └── app/          — 14 student pages (courses, learn, notes, assignments, quizzes, community, etc.)
├── (marketing)/      — 12 public pages (home, about, courses, blog, contact, certificates, etc.)
├── api/              — 25+ API routes (auth, payments, uploads, avatars, chat, progress)
├── error.tsx         — Root error boundary
├── not-found.tsx     — 404 page
├── globals.css       — 400-line theme system
├── robots.ts         — SEO robots
├── sitemap.ts        — Dynamic sitemap
└── layout.tsx        — Root layout (Plus Jakarta Sans, ThemeProvider, Analytics)
```

### Strengths
- Clean route group separation (auth/dashboard/marketing/api)
- Role-based sub-layouts with `requireRole()` guards
- Well-organized API routes with consistent patterns

### Critical Issues

1. **`proxy.ts` is NOT `middleware.ts`** — The file at `src/proxy.ts` exports a middleware function with `config.matcher`, but Next.js requires the file to be named `middleware.ts` at `src/middleware.ts`. If this file is not being recognized as middleware, **all CSRF protection, session validation, and route guards are bypassed**. This is the #1 priority fix.

2. **Empty directories** — `admin/operations/`, `instructor/operations/`, `moderator/actions/` are empty placeholders creating dead route segments.

3. **Dual UI libraries** — HeroUI v3 and shadcn/ui are used inconsistently (detailed in Section 3).

4. **Large page files** — Instructor dashboard is 796 lines, admin dashboard 416 lines. Inline helper functions should be extracted.

5. **Duplicate `getAuthenticatedUser` patterns** — At least 12 API routes define their own auth helper with slight variations.

6. **Duplicate `setSessionCookie`** — Identical in `api/auth/login/route.ts` and `api/auth/register/route.ts`.

---

## 2. Security & Auth

### Auth Flow Summary
- **Login**: POST to `/api/auth/login` → CSRF origin check → rate limit (5/min) → Zod validation → Appwrite session creation → httpOnly secure cookie
- **Register**: POST to `/api/auth/register` → CSRF + rate limit (3/min) → Zod validation → create user + auto-login → session cookie
- **OAuth**: 7 providers (Google, GitHub, Facebook, Apple, Microsoft, Discord, Slack)
- **Forgot/Reset Password**: Server actions with Appwrite recovery flow
- **Email Verification**: Server component with GET-based confirmation

### Session Management
- Cookie: `a_session_{PROJECT_ID}`, httpOnly, secure, sameSite=lax, scoped to `.amarbhaiya.in`
- Middleware validates sessions against Appwrite API with 15s in-memory cache (max 500 entries)

### RBAC
- 4 roles: admin, instructor, moderator, student
- Priority hierarchy: admin > instructor > moderator > student
- Resource-level access: `userCanManageCourse()`, `userCanManageLesson()`, `userHasCourseAccess()`
- **Gap**: Middleware only checks session validity, not role. Role enforcement is at page/action level.

### Security Findings

| Severity | Issue |
|----------|-------|
| **CRITICAL** | `proxy.ts` naming — middleware may not be running at all |
| **CRITICAL** | Login uses `createAdminClient()` instead of `createPublicClient()` — unnecessary API key exposure |
| **HIGH** | Email enumeration on registration (409 "email already exists") |
| **HIGH** | No rate limiting on forgot-password, verify-email, password recovery |
| **HIGH** | In-memory rate limiting ineffective on Vercel serverless (per-instance) |
| **MEDIUM** | `'unsafe-eval'` and `'unsafe-inline'` in CSP script-src |
| **MEDIUM** | No CSRF tokens — relies solely on Origin/Referer headers |
| **MEDIUM** | No account lockout mechanism after failed logins |
| **MEDIUM** | `getLoggedInUser()` swallows errors, may cause all users to appear as "student" during Appwrite outages |
| **MEDIUM** | `incrementCouponUsageAction` has read-modify-write race condition |
| **LOW** | Certificate verification token is predictable (not cryptographically secure) |
| **LOW** | `x-forwarded-for` IP spoofable without trusted proxy |
| **LOW** | No password breach checking (HaveIBeenPwned) |
| **CLEAN** | No hardcoded secrets found in source code |

---

## 3. UI/UX & Components

### Two Competing UI Systems

| System | Used In | API Style |
|--------|---------|-----------|
| **HeroUI v3** (`@heroui/react`) | Auth forms, layout navbar/sidebar/header, theme-toggle, homepage | `onPress`, `isPending`, `isIconOnly`, `variant="primary"` |
| **shadcn/ui v4** (`radix-ui`) | All `ui/` primitives, dashboard pages, marketing pages, course components | `onClick`, `asChild`, `variant="default"` |

**This creates visual and API inconsistency across the entire application.** Two Button components, two Input components, two Checkbox components, two Label components — all with different prop APIs and visual styles.

### Theme System
- Custom `ThemeProvider` (NOT next-themes) with class-based dark/light toggling
- OKLCH color space throughout — perceptually uniform
- Light: warm cream (`oklch(0.978 0.012 88)`), Dark: OLED near-black (`oklch(0.110 0.012 262)`)
- Accent: saffron/amber (`oklch(0.72 0.17 55)`)

### CSS Issues
| Issue | Severity |
|-------|----------|
| `--popover`/`--popover-foreground` undefined — sonner toasts may be invisible | **HIGH** |
| `--font-heading` references "Clash Display" which is never loaded | **MEDIUM** |
| `shadow-retro`, `shadow-retro-sm`, `shadow-retro-lg` used but not defined in globals.css | **MEDIUM** |
| `data-theme="amarbhaiya"` selectors defined but never applied (class-based toggling used) | **LOW** |
| `animate-fade-in-up`, `animate-slide-in-left` classes used but @keyframes not in globals.css | **LOW** |

### Component Inventory

| Category | Components | Notes |
|----------|-----------|-------|
| `ui/` (shadcn) | button, card, input, badge, textarea, checkbox, accordion, separator, tabs, sheet, tooltip, navigation-menu, avatar, sonner, label, reveal-wrapper | 16 components |
| `auth/` | login-form, register-form, forgot-password-form, reset-password-form | 4 components |
| `layout/` | navbar (HeroUI), sidebar, dashboard-header, bottom-tab-bar, footer | 5 components |
| `dashboard/` | stat-card, empty-state, activity-feed, page-header | 4 components |
| `marketing/` | announcement-banner, section-heading, retro-panel | 3 components |
| `course/` | course-player, lesson-sidebar, video-player, comment-section, progress-bar | 5 components |
| `instructor/` | course-thumbnail-upload, direct-appwrite-upload, lesson-video-upload | 3 components |
| Root-level | navbar+navbar-client, footer, theme-provider, theme-toggle, skip-link, motion-drawer, timeline-animation, video-player, lesson-video-player, quiz-form, razorpay-checkout, billing-checkout, use-media-query, hero-digital-success | 14 components |

### Dead/Unused Components
| File | Status |
|------|--------|
| `hero-digital-success.tsx` | Empty stub — explicitly marked REMOVED |
| `navbar.tsx` + `navbar-client.tsx` | Root-level shadcn version — appears unused (layout uses `layout/navbar`) |
| `footer.tsx` | Root-level RetroPanel version — appears unused (layout uses `layout/footer`) |
| `ui/navigation-menu.tsx` | Never imported |
| `ui/sheet.tsx` | Never imported |
| `ui/tooltip.tsx` | Never imported |
| `ui/separator.tsx` | Never imported |
| `motion-drawer.tsx` | Never imported |
| `timeline-animation.tsx` | Never imported |

### Duplicate Components
- **2 Navbar implementations** (HeroUI glass pill vs shadcn retro border)
- **2 Footer implementations** (editorial utility vs RetroPanel)
- **2 VideoPlayer implementations** (simple native vs full-featured custom)
- **2 SkipLink implementations** (components/skip-link.tsx vs lib/utils/accessibility.tsx)
- **4 Upload forms** with duplicated `formatBytes()` helper

### Accessibility
- **Good**: SkipLink, focus rings, aria-labels, aria-live regions, semantic HTML, 44px touch targets
- **Missing**: `prefers-reduced-motion` support, color contrast issues on footer text

### Animations
- CSS-based reveal with IntersectionObserver (GPU-composited, fire-once)
- Framer Motion (motion/react) in 2 components (drawer, timeline)
- `blur(20px)` animation in timeline — NOT GPU-composited, causes jank on mobile
- `backdrop-filter: blur(20px)` on nav-island — expensive on older Android

---

## 4. Server Actions & Form Wrappers

### Inventory
- **~90 server action exports** across 25 domain files
- **54 form wrapper files** in `form-wrappers/` (plus 4 legacy in `enrollment-form-wrapper.ts`)
- **2 test files** for actions (subscriptions, notifications)

### Action Categories

| Domain | File | Actions |
|--------|------|---------|
| Account | account.ts | 4 (RSVP, cancel RSVP, change password, update name) |
| Payments | admin-payments.ts | 3 (update status, refund, reminder) |
| Assignments | assignments.ts | 3 (create, delete, list) |
| Certificates | certificate.ts | 4 (issue, get user certs, get by ID) |
| Categories | categories.ts | 2 (create, update) |
| Comments | comments.ts | 4 (post/get lesson, post/get course) |
| Community | community.ts | 7 (replies, threads, lock/unlock/delete) |
| Course Resources | course-resources.ts | 5 (CRUD + options + list) |
| Coupons | coupons.ts | 7 (CRUD, validate, analytics) |
| Curriculum | curriculum.ts | 4 (create/update module, create/update lesson) |
| Dashboard | dashboard.ts | 4 (forum thread, course draft, live sessions) |
| Delete | delete.ts | 5 (course, module, lesson, category, live session) |
| Enroll | enroll.ts | 4 (enroll, check, admin enroll/unenroll) |
| Marketing | marketing.ts | 6 (site copy, blog CRUD, slug check) |
| Moderation | moderation.ts | 2 (apply/resolve) |
| Notifications | notifications.ts | 6 (CRUD, mark read, broadcast) |
| Operations | operations.ts | 3 (role, visibility, instructor edit) |
| Profile | profile.ts | 4 (profile, billing, payment history) |
| Progress | progress.ts | 3 (complete lesson, get progress) |
| Quiz | quiz.ts | 6 (create, add question, submit, delete) |
| Resources | standalone-resources.ts | 4 (CRUD) |
| Submissions | submissions.ts | 3 (submit, list, grade) |
| Subscriptions | subscriptions.ts | 5 (user/admin CRUD) |
| Upload | upload.ts | 6 (thumbnails, videos, resources, blog, avatar) |
| Verification | verification.ts | 4 (email verify, password recovery) |

### Naming Bug
- `applyModerationActionAction` and `resolveModerationActionAction` — double "Action" suffix

### Duplicate Helpers
- `parseBoolean`/`parseInteger` — duplicated in 5 files
- `revalidateHomeContentPaths()` — duplicated in 3 files
- `revalidateCourseEditorPaths()` — duplicated in 2 files
- `getCourseRow()` — duplicated in 2 files
- `userCanManageCourse()` — duplicated in `operations.ts` (should import from `access.ts`)
- `getAssignmentRow()` — duplicated in `assignments.ts` and `submissions.ts`
- `chunkValues` — duplicated in `row-pagination.ts` and `dashboard-data/internal.ts`
- `parseStringArray`/`toStringArray` — two identical functions in `internal.ts`

### Missing Error Handling (6+ actions)
- `updateCategoryAction` — no try-catch around `tablesDB.updateRow`
- `updateLiveSessionAction` — no try-catch
- `updateCurriculumModuleAction` — no try-catch
- `updateCurriculumLessonAction` — no try-catch
- `updateInstructorCourseAction` — no try-catch
- `updateCourseVisibilityAction` — no try-catch
- `applyModerationActionAction` — no try-catch around `tablesDB.createRow`
- `incrementCouponUsageAction` — no try-catch, plus race condition

### Inconsistent Error Handling
- **Style 1** (majority): `console.error` + `actionError()`
- **Style 2** (quiz, curriculum): `handleActionError()` with Sentry integration
- **Style 3** (getters): Silent empty array/null return

The well-designed `handleActionError` with Sentry integration exists but is barely used (2-3 files).

### Legacy vs New Pattern
- `enrollment-form-wrapper.ts` (root level) — 4 legacy wrappers
- `form-wrappers/` directory — 54 new wrappers
- Should be consolidated

---

## 5. Appwrite Integration

### Client Patterns
| Client | Lifetime | Used For |
|--------|----------|----------|
| Admin (`getAdminClient`) | Singleton | All privileged operations |
| Session (`createSessionClient`) | Per-request | User-scoped operations |
| Public (`createPublicClient`) | Per-request | Unauthenticated operations |
| Browser (`client.ts`) | Singleton | Realtime subscriptions |

### Caching Strategy
- **Public pages**: `unstable_cache` with tag-based revalidation (5min-1hr TTL)
- **Dashboard pages**: Direct queries, no cache (by design)
- **Safe wrappers**: `safeListRows`, `safeGetRow`, etc. silently return empty/null on error

### Dashboard Data Architecture
- 6 role-based modules under `dashboard-data/`
- `internal.ts` (687 lines) — shared types, utilities, safe query wrappers
- Community module uses session client (only dashboard module requiring auth for data fetch)

### File Upload Pipeline (2-step finalize)
1. Client uploads directly to Appwrite Storage
2. Client calls server action with `uploadedFileId`
3. Server validates: file exists, extension allowed, magic byte signature, user permissions
4. Server attaches file ID to database row, deletes previous file, revalidates paths

### Payment Integration (Razorpay)
- Timing-safe HMAC-SHA256 verification
- Payment state machine: pending → completed/failed, completed → refunded
- Reconciliation engine handles enrollment activation/deactivation

### Issues
| Issue | Severity |
|-------|----------|
| `chunkValues` duplicated in `row-pagination.ts` and `internal.ts` | MEDIUM |
| `listRowsByFieldValues` duplicated with different implementations | MEDIUM |
| `PublicCourseDetail` type defined in 2 places | MEDIUM |
| Missing `"use server"` on `access.ts`, `progress.ts`, `row-pagination.ts`, `delete-plan.ts`, `file-signature.ts` | MEDIUM |
| Amount handling inconsistency (paise vs rupees) across files | LOW |
| `getPublicCoursesPageData` not wrapped in `unstable_cache` | LOW |
| `cachedNotesPage` cache key doesn't include `limit` parameter | LOW |

---

## 6. SEO & Marketing

### SEO Gaps (Critical)

| Element | Status | Impact |
|---------|--------|--------|
| OpenGraph images | **Missing everywhere** | No social preview on Facebook/Twitter/WhatsApp |
| Twitter images | **Missing** | Same |
| JSON-LD structured data | **Zero instances** | No rich results (Course cards, Articles, Organization) |
| Canonical URLs | **Missing everywhere** | Duplicate content risk with filtered pages |
| `og:image` per page | **Missing** | No page-specific social previews |
| RSS/Atom feed | **Missing** | No blog subscriber feed |
| Web App Manifest | **Missing** | Apple Web App hint but no manifest |
| Certificate detail metadata | **Missing** | No title, no description |
| Breadcrumb navigation/schema | **Missing** | No breadcrumb rich results |

### Sitemap Issues
- `/app/notes` listed but blocked by robots.txt (`/app/` disallowed)
- `/certificates` not in sitemap
- `/notes` marketing page (redirect) not in sitemap

### Robots.txt
- Properly blocks `/app/`, `/admin/`, `/instructor/`, `/moderator/`, `/api/`
- Conflict with sitemap including `/app/notes`

### Marketing Content Quality
- **No AI slop detected** — copywriting is genuine, culturally appropriate Hinglish
- Strong editorial voice throughout (about, blog, course detail, contact pages)
- Empty CMS states handled gracefully
- Contact form uses EmailJS (no CAPTCHA, spam risk)

### Static Pages
- **Privacy**: Missing cookies policy, analytics disclosure, children's privacy (critical for minors-serving edtech), DPDP Act specifics
- **Terms**: Missing refund policy, liability, dispute resolution, governing law
- **Both**: Dynamic `new Date()` as "effective date" (should be fixed)

---

## 7. Performance & CSS

### Bundle Concerns

| Package | Issue |
|---------|-------|
| `next-themes` | **Dead dependency** — installed but never imported (custom ThemeProvider used) |
| `shadcn` | **Should be devDependency** — CLI tool, not runtime |
| `@emailjs/browser` | Not lazy-loaded — included in all marketing pages |
| `motion` (Framer Motion) | Only 2 components use it — check tree-shaking |
| `stream-chat` | Large package, server-only but may leak to client bundle |

### Code Splitting
- **No `next/dynamic` usage anywhere** — heavy components statically imported
- `MotionDrawer`, `@emailjs/browser`, `timeline-animation` should be lazy-loaded

### CSS Architecture
- Mature OKLCH custom property system
- Tailwind v4 integration via `@theme inline`
- Fluid section spacing with `clamp()`
- iOS safe-area support throughout
- Grain overlay (SVG noise texture) at z-index 999 — compositing overhead

### Performance Issues
| Issue | Severity |
|-------|----------|
| No `prefers-reduced-motion` support | **HIGH** |
| `--popover`/`--popover-foreground` undefined (sonner toast styling) | **HIGH** |
| No `next/dynamic` for heavy components | **MEDIUM** |
| `transition-all` instead of specific properties | **LOW** |
| `blur(20px)` animation on mobile | **LOW** |
| Grain overlay always composited | **LOW** |

### Third-Party Scripts
- Sentry: Replay integration adds ~20-30KB gzipped, double server init (sentry.server.config.ts + instrumentation.ts)
- Vercel Analytics: Minimal (~2KB), loaded on every page
- Razorpay: Server-only, good

---

## 8. Code Quality & AI Slop

### AI-Generated Slop: NONE DETECTED
The codebase is remarkably clean:
- No Lorem ipsum or placeholder text
- No excessive JSDoc
- No generic marketing buzzwords
- Genuine Hinglish copywriting
- No TODO/FIXME/HACK comments

### Code Duplication (Major Issue)
| Duplication | Files Affected | Severity |
|-------------|---------------|----------|
| `AnyRow` type redefined 36x with 3 incompatible signatures | 36 files | **CRITICAL** |
| `parseBoolean`/`parseInteger` | 5 files | MEDIUM |
| `revalidateHomeContentPaths()` | 3 files | MEDIUM |
| `getCourseRow()` | 2 files | MEDIUM |
| `userCanManageCourse()` | 2 files | MEDIUM |
| `getAssignmentRow()` | 2 files | LOW |
| `chunkValues` | 2 files | LOW |
| `parseStringArray`/`toStringArray` | 2 locations in same file | LOW |
| `formatBytes()` | 4 upload form files | LOW |
| `getAuthenticatedUser()` pattern | 12+ API routes | MEDIUM |
| `setSessionCookie()` | 2 API routes | LOW |

### Type Safety
- Zero `any` type usage — clean
- 25+ `as Record<string, unknown>` casts (symptom of AnyRow issue)
- `declare global` for Razorpay Window type
- `eslint-disable` for CJS `require()` in ESM project

### Console Usage
- 0 `console.log` — clean
- 85 `console.error` — mostly legitimate server-side logging
- 5 `console.warn` — legitimate operational warnings
- Many `console.error` calls should use the existing `handleActionError` with Sentry integration

---

## 9. Testing & CI/CD

### Test Coverage
- **14 test files** for 150+ source files — minimal coverage
- All tests are server-side/utility only (`.test.ts`)
- **Zero component tests** (`.test.tsx`)
- **No integration or E2E tests**
- No coverage thresholds configured

### CI Pipeline (`.github/workflows/ci.yml`)
- Runs on push to master + PRs
- Matrix: Node.js 20 and 22
- Steps: checkout → npm ci → lint → typecheck → test
- **Missing**: `next build` step (build-breaking bugs not caught)
- **Missing**: `npm audit` (security audit)
- **Missing**: E2E tests
- **Missing**: Deployment gate

---

## 10. Critical Fixes Checklist

### Priority 1 — Must Fix Immediately
- [ ] **Rename `src/proxy.ts` to `src/middleware.ts`** — all security middleware may be bypassed
- [ ] **Define `--popover`/`--popover-foreground` CSS variables** — sonner toasts may be invisible
- [ ] **Fix login to use `createPublicClient()`** instead of `createAdminClient()` — principle of least privilege
- [ ] **Add rate limiting to forgot-password, verify-email, password recovery** endpoints
- [ ] **Fix sitemap**: Remove `/app/notes`, add `/notes` and `/certificates`

### Priority 2 — Fix Before Launch
- [ ] **Add OpenGraph images** — at minimum global `opengraph-image.png`, ideally per-page
- [ ] **Add JSON-LD structured data** — WebSite, Organization, Course, Article schemas
- [ ] **Add canonical URLs** — especially on filtered course pages
- [ ] **Resolve dual UI library** — pick one (HeroUI or shadcn) and migrate consistently
- [ ] **Extract `AnyRow` type** to shared definition in `types/`
- [ ] **Add `prefers-reduced-motion` support** to all animations
- [ ] **Add `next/dynamic`** for MotionDrawer, EmailJS, timeline-animation
- [ ] **Fix missing try-catch** in 8+ update actions
- [ ] **Fix `applyModerationActionAction` naming bug**
- [ ] **Add metadata to certificate detail page** + add `noindex`

### Priority 3 — Fix Before Scale
- [ ] **Extract duplicated helpers** (parseBoolean, revalidatePaths, getCourseRow, etc.) to shared utilities
- [ ] **Consolidate error handling** — use `handleActionError` with Sentry everywhere
- [ ] **Remove dead dependencies** (next-themes, move shadcn to devDependencies)
- [ ] **Remove dead components** (hero-digital-success, unused nav/footer implementations)
- [ ] **Add `next build` to CI pipeline**
- [ ] **Add component tests** and increase coverage
- [ ] **Fix privacy/terms pages** — add cookies, children's privacy, DPDP Act, refund policy
- [ ] **Add RSS feed** for blog
- [ ] **Add CAPTCHA/honeypot** to contact form
- [ ] **Create `public/manifest.json`** for PWA support
- [ ] **Fix `--font-heading`** — load Clash Display or DM Serif Display via next/font
- [ ] **Consolidate Sentry server init** — remove duplicate from sentry.server.config.ts
- [ ] **Add breadcrumb navigation** with schema markup
- [ ] **Add pagination** to courses and blog pages
