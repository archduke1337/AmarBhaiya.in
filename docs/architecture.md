# Repository Architecture

## Workspace Shape

```text
apps/
  web/                 Next.js product and public website

packages/
  (future shared packages live here only when a second consumer exists)

tooling/
  scripts/             Appwrite setup and repository automation

docs/
  architecture.md     Repository and boundary decisions
```

## Boundary Rules

1. `apps/web` owns route handlers, server actions, Appwrite orchestration, and product-specific UI.
2. A shared package must have at least two real consumers before code moves out of `apps/web`.
3. Shared packages must not import from an app or depend on app-only environment variables.
4. Server-only code stays behind explicit server boundaries and is never exported by a client package.
5. Payments, authentication, and storage remain product-domain modules until their contracts are stable.
6. Root scripts orchestrate work through Turborepo; application scripts describe how one app runs.

## `apps/web/src` Layout

```text
src/
  app/                   Next.js App Router routes (URLs are fixed by path)
  server/
    actions/             All server actions (+ form-wrappers/)
    appwrite/            Appwrite data access, auth, uploads, marketing content
    payments/            Razorpay client + course payment orchestration
    uploads/             Upload flows (instructor files, lesson video, submissions)
    stream/              StreamChat client setup
    cache/               Next.js cache wrappers for public data
    validators/          Zod schemas
    csrf.ts, rate-limiter.ts
  lib/                   Client-safe utilities (utils/, errors/) — importable from anywhere
  hooks/                 Shared React hooks
  components/
    ui/                  Design-system primitives
    layout/              Navbar, Footer, sidebar, header, skip-link
    marketing/           Public-site blocks
    auth/                Login/register/reset forms
    dashboard/           Shared dashboard primitives (PageHeader, StatCard, EmptyState)
    course/              Course player, video player, lesson UI, quiz form
    billing/             Checkout + Razorpay UI
    instructor/          Instructor upload forms
    profile/             Avatar/profile UI
    theme/               Theme provider + toggle
  config/                Dashboard navigation config
  types/                 Shared domain types
```

Rule: `src/server/**` is only reachable from route handlers, server actions, and server components; `src/lib/**` and `src/components/**` stay server-import-safe and never pull in `node-appwrite` server clients.

## Planned Extraction Order

1. `packages/types` for stable public/domain contracts shared by a future mobile or admin app.
2. `packages/ui` for components that are demonstrably shared across applications.
3. `packages/config` for shared TypeScript, ESLint, and formatting policy.
4. Additional apps only when there is a concrete deployment or user boundary.

## Current Migration Policy

This first migration changes the repository boundary, not product behavior. Backend, Appwrite schema, payment processing, and route semantics stay unchanged.
