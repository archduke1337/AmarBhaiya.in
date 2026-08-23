# Shared Packages

Shared packages are intentionally empty during the first workspace migration.

Create a package here only when a second app consumes the same code. Do not move code from `apps/web` for organizational symmetry alone. Every package should have an explicit public API, its own `package.json`, and no dependency on application-only environment variables.
