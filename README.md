# amarbhaiya.in

Creator-led learning platform and personal brand for Amar Bhaiya.

The repository is managed as an npm workspaces monorepo with Turborepo. The current product lives in `apps/web`; future mobile, admin, or shared packages can be added without mixing their runtime concerns into the web app.

## Repository Layout

```text
apps/
  web/                 Next.js application, public site, dashboards, and API routes

packages/
  (shared packages are added only when a second consumer exists)

tooling/
  scripts/             Infrastructure and Appwrite setup scripts

docs/
  architecture.md     Workspace boundaries and extraction rules
```

## Requirements

- Node.js 20+
- npm 10+
- Appwrite project configuration for runtime features

## Commands

Run from the repository root:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

Run a command for only the web app:

```bash
npx turbo run dev --filter=@amarbhaiya/web
npx turbo run build --filter=@amarbhaiya/web
```

Set up the Appwrite project after configuring `apps/web/.env`:

```bash
npm run setup:appwrite
```

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` for local development. For infrastructure scripts, either use the same file or set `DOTENV_CONFIG_PATH`. Never commit secrets. The web app owns its runtime environment because Next.js resolves environment files relative to the app boundary.

## Architecture

Read [`docs/architecture.md`](docs/architecture.md) before adding a new app or package. The first migration intentionally keeps product-specific authentication, Appwrite, payments, and UI inside `apps/web` until their contracts are stable enough to share.
