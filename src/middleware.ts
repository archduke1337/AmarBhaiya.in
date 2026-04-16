// ── Next.js Middleware Entry Point ───────────────────────────────────────────
// This file MUST be at src/middleware.ts (or root/middleware.ts) for Next.js
// to recognise it as middleware. It re-exports the proxy logic from proxy.ts
// so the actual routing/auth logic stays in one maintainable place.

export { proxy as middleware, config } from "@/proxy";
