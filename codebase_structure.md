# AmarBhaiya.in Codebase Structure

This document explains how the project is organized, what each major folder is responsible for, and how data flows through the system.

## 1) High-level architecture

- Framework: Next.js App Router (TypeScript)
- Frontend: React 19 + shared UI components
- Backend pattern: Server Actions + Route Handlers
- Data layer: Appwrite TablesDB + Storage
- Payments: Razorpay and PhonePe integrations
- Realtime/community: Stream Chat token and user provisioning

In short:
- Public website lives in marketing routes.
- Role-based product experience lives in dashboard routes.
- Business logic is mostly in server actions and lib adapters.

## 2) Root directory map

| Path | Purpose |
|---|---|
| AGENTS.md | Agent/workflow customization notes for coding assistants. |
| package.json | Scripts, dependencies, and project metadata. |
| next.config.ts | Next.js runtime/build configuration. |
| eslint.config.mjs | Lint rules used across TypeScript/React files. |
| vitest.config.ts | Test runner configuration. |
| postcss.config.mjs | PostCSS/Tailwind processing setup. |
| components.json | shadcn/radix UI component registry config. |
| scripts/setup-appwrite.mjs | Creates Appwrite DB, tables, columns, indexes, and buckets. |
| public/ | Static assets served directly by Next.js. |
| src/ | Main application source code. |

## 3) Source code structure

```text
src/
|- app/                # Next.js routes and layouts
|  |- (marketing)/     # Public pages
|  |- (auth)/          # Login/register/reset flows
|  |- (dashboard)/     # Role-based app surfaces
|  |- api/             # API route handlers (auth/payments/content/stream)
|  |- layout.tsx       # Root app shell + metadata + theme provider
|  |- globals.css      # Global styles
|  |- error.tsx        # Global error boundary
|  |- not-found.tsx    # 404 page
|- actions/            # Server Actions for mutations and secure workflows
|- components/         # Reusable UI and feature components
|- lib/                # Adapters, integrations, and helpers
|- types/              # Shared types/interfaces
|- proxy.ts            # Edge/proxy auth + routing logic
```

## 4) Route groups and what they do

### 4.1 Marketing routes: src/app/(marketing)

Public pages for acquisition and discovery:
- /
- /about
- /courses and /courses/[slug]
- /blog and /blog/[slug]
- /contact
- /certificates/[id]

Key behavior:
- Uses a shared marketing layout with navbar/footer.
- Content can be managed from admin marketing CMS at /admin/marketing.

### 4.2 Auth routes: src/app/(auth)

Authentication and account recovery:
- /login
- /register
- /forgot-password
- /reset-password
- /verify-email

Key behavior:
- If user is already authenticated, proxy redirects away from auth pages.

### 4.3 Dashboard routes: src/app/(dashboard)

Authenticated app with role-based sections:
- Student area under /app/*
- Instructor area under /instructor/*
- Moderator area under /moderator/*
- Admin area under /admin/*

Key behavior:
- Dashboard layout resolves user role and renders role-specific navigation.
- Admin includes marketing CMS, users, courses, payments, live, moderation, audit.

### 4.4 API routes: src/app/api

Server endpoints for integration and machine-to-machine tasks:
- auth: login/register/logout/oauth
- payments: Razorpay and PhonePe create-order + webhook handlers
- content: homepage content endpoint
- stream: chat/video token route

## 5) Server actions layer: src/actions

Server actions are grouped by domain. They handle form submissions, role checks, DB writes, and cache revalidation.

| File | Responsibility |
|---|---|
| account.ts | Account-level user updates and profile-related operations. |
| enrollment.ts | Course enrollment and progress-related workflows. |
| assignments.ts | Assignment creation, submission, and grading workflows. |
| comments.ts | Course comment/reply actions. |
| community.ts | Forum/category/thread/reply operations. |
| dashboard.ts | Core dashboard create/update actions (threads, courses, sessions, etc.). |
| notifications.ts | Notification creation/read-state/broadcast utilities. |
| operations.ts | Admin-heavy operations including marketing/blog CMS actions. |
| resources.ts | File/resource CRUD for course and standalone materials. |
| subscriptions.ts | Subscription plan and lifecycle operations. |
| upload.ts | Upload helper flows to Appwrite storage buckets. |
| verification.ts | Verification and confirmation workflows. |

Common pattern in actions:
1. Validate input (zod/parsing).
2. Authorize user/role.
3. Write via Appwrite client.
4. Revalidate affected routes.

## 6) UI and component layer: src/components

| Folder | Responsibility |
|---|---|
| ui/ | Primitive reusable building blocks (button, card, input, tabs, badge, etc.). |
| layout/ | Shared dashboard shell components like header/sidebar. |
| dashboard/ | Dashboard-specific composed components (stat cards, page headers, feeds). |
| course/ | Course player experience (lesson sidebar, progress bar, comments, player). |

Standalone components such as navbar, footer, quiz form, checkout, and theme controls are in src/components root.

## 7) Core libraries: src/lib

### 7.1 Appwrite adapter: src/lib/appwrite

Main backend abstraction for this project:
- config.ts: table/bucket IDs and session cookie naming
- server.ts/client.ts: admin/session clients
- auth.ts/auth-utils.ts: auth and role utilities
- dashboard-data.ts: optimized read models for dashboards
- marketing-content.ts: site copy and marketing content fetch layer
- actions.ts: auth/logout server hooks

### 7.2 Payments: src/lib/payments

- razorpay.ts: order creation and webhook signature verification
- phonepe.ts: payload signing, order creation, webhook decode/verification

### 7.3 Stream integration: src/lib/stream

- client.ts: Stream client setup, user token generation, and user sync

### 7.4 Shared helpers

- src/lib/utils.ts and src/lib/utils/*: formatting, constants, and helper logic
- src/lib/validators/*: schema and validation utilities

## 8) Types: src/types

| File | Responsibility |
|---|---|
| appwrite.ts | Interfaces for Appwrite rows (courses, payments, moderation, etc.). |
| index.ts | Public re-exports for shared typing imports. |

## 9) Request and data flow

Typical UI mutation flow:
1. User submits a form in route component.
2. Route calls a server action from src/actions.
3. Action validates input and checks role.
4. Action writes to Appwrite tables/storage.
5. Action revalidates pages to refresh SSR data.

Integration/webhook flow:
1. External provider calls API route (for example payment webhook).
2. Route verifies signature.
3. Route updates payment/subscription state via Appwrite.
4. Dashboard pages reflect updated status after revalidation/read.

## 10) Access control model

- Public: marketing pages and public content endpoints.
- Auth required: /app, /instructor, /moderator, /admin route prefixes.
- Role protected: sensitive pages/actions enforce admin/instructor/moderator roles.
- Proxy layer in src/proxy.ts performs route guard + redirects.

## 11) Developer workflow

Main commands:
- npm run dev
- npm run lint
- npm run test
- npm run build

Infrastructure setup:
- Use scripts/setup-appwrite.mjs to provision Appwrite tables and indexes.

## 12) Suggested next cleanup

- Replace default README.md template with project-specific onboarding.
- Link this document from README for first-time contributors.
- Add architecture diagram and sequence diagrams for payments and enrollment.