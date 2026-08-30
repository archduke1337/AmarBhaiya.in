# amarbhaiya.in Repository Map

**Generated:** August 30, 2026  
**Scope:** Tracked repository files and the active `apps/web` application.

This is a durable architectural map, not a replacement for reading the source. Before changing behavior, inspect the exact module and its callers.

## 1. Workspace

```text
apps/web/       Next.js product: public site, auth, dashboards, APIs
packages/       Reserved for shared packages; currently README-only
 tooling/       Repository/Appwrite setup scripts
 docs/          Architecture and audit documentation
 .ui-craft/     Product/design decisions, patterns, tokens, brief
 .agents/       Local reusable skills
```

Root orchestration is npm workspaces + Turborepo. Root commands: `npm run dev`, `build`, `start`, `lint`, `typecheck`, `analyze`, and `setup:appwrite`. The package manager declared by the repository is npm.

## 2. Application Runtime

`apps/web` is Next.js App Router with TypeScript, React 19, Tailwind CSS 4, Appwrite, Razorpay, Stream Chat, EmailJS, Motion, Radix/shadcn primitives, Sonner, Zod, and Lucide.

Important configuration:

- `components.json`: shadcn configuration; aliases `@/components`, `@/lib`, `@/hooks`; SmoothUI registry namespace.
- `next.config.ts`: image remote patterns, security headers/CSP, Turbopack root, server external packages, server-action body limit.
- `postcss.config.mjs`: Tailwind PostCSS integration.
- `eslint.config.mjs`: lint policy.
- `tsconfig.json`: TypeScript aliases and compiler settings.
- `.env.example`: Appwrite, Stream, Razorpay, EmailJS, app URL, and Upstash Redis variables.
- `src/app/layout.tsx`: root fonts, metadata, theme provider, toaster, analytics, JSON-LD, viewport.
- `src/app/globals.css`: OKLCH tokens, typography, responsive utilities, focus styles, safe areas, motion/reduced-motion, surfaces.

## 3. Route Groups

### Public site: `src/app/(site)`

`layout.tsx` wraps pages with `Navbar`, `Footer`, logged-in detection, skip link, and main content. `loading.tsx` provides a public-page skeleton.

Routes:

- `/`: marketing homepage; Appwrite-backed marketing content, classroom photography, courses, collections, features, testimonials, CTAs.
- `/about`: mission, identity, journey, classroom imagery.
- `/contact`: contact channels plus EmailJS-backed form.
- `/courses`: searchable/filterable/paginated public course catalogue.
- `/courses/[slug]`: public course detail and enrollment/checkout path.
- `/notes`: public notes discovery/filter/download gate.
- `/blog`, `/blog/[slug]`: blog index and article detail.
- `/pricing`: notes/course/premium pricing explanation.
- `/faq`: searchable FAQ.
- `/certificates`, `/certificates/[id]`: certificate listing/verification.
- `/careers`, `/parents`, `/support`: public information/support pages.
- `/community-guidelines`, `/cookie-policy`, `/grievance-redressal`, `/legal`, `/privacy`, `/refund-policy`, `/terms`: policy/legal pages.

### Authentication: `src/app/(auth)`

`layout.tsx` provides split editorial/auth presentation. Routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`. Forms live in `components/auth` and call API routes or server actions with generic anti-enumeration messages.

### Dashboard: `src/app/(dashboard)`

`layout.tsx` requires authentication and provides `Sidebar`, `DashboardHeader`, mobile navigation, responsive content shell, and bottom tab bar. `loading.tsx` provides dashboard skeletons; `error.tsx` provides retry UI.

Role layouts:

- `admin/layout.tsx`: `requireRole(["admin"])`.
- `instructor/layout.tsx`: `requireRole(["admin", "instructor"])`.
- `moderator/layout.tsx`: `requireRole(["admin", "moderator"])`.
- `app/layout.tsx`: student workspace passthrough.

Student routes (`app/`): dashboard, courses, course detail, lesson learning, assignments, quizzes, quiz detail, notes, live, notifications, billing, community/thread, profile/profile edit.

Instructor routes: dashboard, courses, course detail, new course, curriculum, resources, categories, coupons, students, submissions, live, earnings.

Moderator routes: dashboard, reports, students, community.

Admin routes: dashboard, users, students/detail, instructors, courses, categories, coupons, payments, subscriptions, live, moderation, notifications, audit, blog, marketing CMS.

## 4. Shared UI Layers

### Layout (`components/layout`)

- `navbar.tsx`: public responsive island navigation, auth state, theme switch, mobile focus trap.
- `footer.tsx`: public editorial footer and legal/social navigation.
- `sidebar.tsx`: role-aware desktop sidebar and mobile modal drawer.
- `dashboard-header.tsx`: dashboard identity, role, theme, sign-out.
- `bottom-tab-bar.tsx`: mobile role-aware primary navigation.
- `skip-link.tsx`: keyboard skip navigation.

### Dashboard primitives (`components/dashboard`)

- `page-header.tsx`: page eyebrow/title/description/actions.
- `stat-card.tsx`: stat grid and metrics.
- `activity-feed.tsx`: linked/non-linked activity rows, badges, timestamps, empty text.
- `empty-state.tsx`: icon, explanation, primary/secondary next actions.
- `index.ts`: barrel exports.

### UI primitives (`components/ui`)

shadcn/Radix-style `Button`, `Card`, `Input`, `Textarea`, `PasswordInput`, `Checkbox`, `Label`, `Badge`, `Accordion`, `Tabs`, `Avatar`, Sonner, and `RevealWrapper`. `Card`/dashboard primitives use softer surfaces; marketing uses `RetroPanel` and `card-bezel` utilities.

### Domain components

- `auth`: login/register/recovery forms.
- `billing`: billing info and Razorpay checkout.
- `course`: video playback, lesson sidebar, progress, comments, quizzes.
- `instructor`: thumbnail, direct storage, lesson video uploads, delete confirmation.
- `marketing`: content sections, FAQ, markdown, category tabs, CTA, animated feature cards.
- `notes`: authenticated download control.
- `profile`: avatar upload.
- `theme`: provider/toggle.
- `smoothui`: animated tabs, magnetic button, progress bar, glow hover.

## 5. Server Architecture

### Authentication and access

- `server/appwrite/server.ts`: admin/session/public Appwrite client construction.
- `auth.ts`: current-user lookup, `requireAuth`, `requireRole`, role assignment.
- `api-auth.ts`: non-redirecting API authentication helpers.
- `auth-utils.ts`: role normalization/priority.
- `access.ts`: course, lesson, resource ownership and student course access.
- `session-cookie.ts`: Appwrite session cookie creation.
- `csrf.ts`: origin validation.
- `rate-limiter.ts`: Upstash Redis or in-memory fallback.

### Appwrite data

- `config.ts`: canonical database/table/bucket IDs.
- `row-pagination.ts`: complete paginated row listing and field-value queries.
- `dashboard-data.ts` plus `dashboard-data/{admin,community,instructor,internal,moderator,public,student}.ts`: role-specific read models and safe query helpers.
- `marketing-content.ts`: public/home/about/contact/course/blog content reads.
- `progress.ts`: lesson progress lookup/upsert.
- `public-config.ts`: browser-safe Appwrite configuration.
- `file-proxy.ts`, `file-signature.ts`: secure file delivery/signature validation.
- `instructor-file-upload.ts`, `lesson-video-upload.ts`: upload finalization and ownership checks.
- `delete-plan.ts`: staged database/storage deletion orchestration.

### Server actions

Domain files in `server/actions`: account, admin payments, assignments, categories, certificates, comments, community, coupons, course resources, curriculum, dashboard, delete, enrollment, marketing, moderation, notifications, operations, profile, progress, quiz, resources, standalone resources, submissions, subscriptions, upload, verification.

`server/actions/form-wrappers/` adapts ActionResult-returning actions to native form actions and redirects/toasts. Keep server action authorization in the underlying action, not only in the page.

### Payments

- `server/payments/razorpay.ts`: Razorpay client/order/signature verification.
- `course-payment.ts`: payment reconciliation, idempotency, enrollment activation.
- `coupon-usage.ts`: coupon accounting tied to payment.
- API routes create orders, verify client payment signatures, process webhooks, and export payment data.

### Uploads

`server/uploads/*` defines allowed extensions/MIME types/size limits. Upload flows validate extension, magic bytes, ownership, attach storage IDs to Appwrite rows, remove replaced files, and revalidate affected routes.

### Validators/utilities

`server/validators`: auth, billing, course Zod schemas. `lib/utils`: formatting, URL/redirect sanitation, cache paths, pagination, batching, file URLs, sanitization, password strength, action handlers, constants, and error handling.

## 6. API Routes

`src/app/api` contains:

- Auth: login, register, logout, me, OAuth initiation/callback.
- Avatar: current, upload token, complete.
- Content: cached home content.
- Learning: lesson video, progress, completion.
- Resources: course/standalone resource delivery.
- Instructor: upload tokens/completion and lesson video upload tokens/completion.
- Payments: Razorpay create-order, verify, webhook, export.
- Stream: chat token.
- Submissions: protected submission-file delivery.
- Billing: user billing-info.

API routes use non-redirecting auth, Zod payload validation, origin/rate-limit checks where relevant, safe error responses, and Appwrite server clients.

## 7. Appwrite Data Model

Configured tables: `courses`, `categories`, `modules`, `lessons`, `resources`, `enrollments`, `progress`, `quizzes`, `quiz_questions`, `quiz_attempts`, `assignments`, `submissions`, `certificates`, `live_sessions`, `session_rsvps`, `course_comments`, `forum_categories`, `forum_threads`, `forum_replies`, `payments`, `subscriptions`, `moderation_actions`, `audit_logs`, `notifications`, `blog_posts`, `site_copy`, `student_profiles`, `billing_info`, `standalone_resources`, `coupons`.

Storage buckets: `course_videos`, `course_thumbnails`, `course_resources`, `user_avatars`, `certificates`, `blog_images`, `resource_files`.

## 8. External Integrations

- Appwrite: authentication, TablesDB, Storage, user labels/roles.
- Razorpay: paid course orders, verification, webhooks, refunds/export.
- Stream Chat: server token/user setup.
- EmailJS: contact form, dynamically imported on submission.
- Vercel Analytics: conditional on `NEXT_PUBLIC_VERCEL_ENV`.
- Upstash Redis: production-safe distributed rate limiting.

## 9. Security Boundaries

Never import `server/**` into client components. Never trust client prices, roles, file MIME declarations, redirect paths, payment states, or resource IDs. Use `requireRole` for pages/actions and `getApiUser`/context for APIs. Payment verification must bind the stored payment row to the authenticated user. Course access rejects unpublished courses and checks active enrollment/subscription/free preview.

## 10. Design/UX Conventions

- Public pages: editorial hierarchy, `SectionHeading`, `RetroPanel`, `card-bezel`, real classroom imagery.
- Dashboards: utility density, shared `PageHeader`, `StatCard`, `ActivityFeed`, `EmptyState`, compact data rows.
- Controls: shadcn primitives for forms/dialogs/tables/buttons; SmoothUI only where motion materially improves feedback.
- Tokens: use semantic CSS variables and dark-mode variants; avoid light-only hardcoded colors.
- Accessibility: semantic headings, skip links, focus-visible rings, 44px controls, reduced-motion support, labels and live/error semantics.
- Motion: prefer CSS or transform/opacity; avoid animating layout properties; gate hover behavior on hover-capable devices.

## 11. Verification Status

The repository currently has no tracked automated test files or test-runner configuration. The available checks pass:

```text
npm run typecheck  ✅
npm run lint       ✅
npm run build      ✅
```

The production build enumerates all public, auth, dashboard, role-specific, and API routes successfully.

## 12. Known Follow-up Risks

These require live fixtures or deliberate future refactors rather than being inferred from static inspection:

- Live Appwrite/Razorpay/Stream flows need integration testing with real role fixtures.
- No automated business-logic or E2E test suite exists.
- Some large dashboard/page modules contain inline read-model transformation helpers.
- Historical audit documentation contains stale findings; verify source rather than relying on old status tables.
- A full line-by-line semantic review of generated/vendor/build artifacts is intentionally excluded; tracked source/config/assets are covered by the inventory above.
