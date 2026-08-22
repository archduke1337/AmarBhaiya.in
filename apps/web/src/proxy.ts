import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/app", "/instructor", "/moderator", "/admin"];

// Routes that should redirect logged-in users away
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// Subdomain hostnames — single-domain still works, these are optional
const COMMUNITY_HOST = "community.amarbhaiya.in";
const APP_HOST = "app.amarbhaiya.in";
const ADMIN_HOST = "admin.amarbhaiya.in";
const INSTRUCTOR_HOST = "instructor.amarbhaiya.in";
const MODERATOR_HOST = "moderator.amarbhaiya.in";

const SUBDOMAIN_MAP: Record<string, string> = {
  [APP_HOST]: "/app",
  [ADMIN_HOST]: "/admin",
  [INSTRUCTOR_HOST]: "/instructor",
  [MODERATOR_HOST]: "/moderator",
};

// ── Session Validation Cache ─────────────────────────────────────────────────
// This is an in-process Map — it resets on cold starts / serverless spin-ups.
// That is intentional: a cold start always validates freshly against Appwrite.
// On warm instances the cache prevents a network round-trip on every request.
// TTL is deliberately short (15 s) to keep the stale-auth window minimal.
const SESSION_VALIDATION_CACHE_TTL_MS = 15 * 1000;
const SESSION_CACHE_MAX_ENTRIES = 500;

type SessionCacheEntry = { valid: boolean; expiresAt: number };
const sessionValidationCache = new Map<string, SessionCacheEntry>();

/** Evict all expired entries and trim the Map to MAX size (LRU-lite eviction). */
function pruneSessionCache(): void {
  const now = Date.now();
  for (const [key, entry] of sessionValidationCache) {
    if (entry.expiresAt <= now) {
      sessionValidationCache.delete(key);
    }
  }
  // If still over limit, delete oldest inserted entries
  if (sessionValidationCache.size > SESSION_CACHE_MAX_ENTRIES) {
    const overflow = sessionValidationCache.size - SESSION_CACHE_MAX_ENTRIES;
    let deleted = 0;
    for (const key of sessionValidationCache.keys()) {
      if (deleted >= overflow) break;
      sessionValidationCache.delete(key);
      deleted++;
    }
  }
}

function getAppwriteSessionValidationConfig(): {
  endpoint: string;
  projectId: string;
} | null {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim();
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();

  if (!endpoint || !projectId) {
    return null;
  }

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    projectId,
  };
}

async function validateAppwriteSessionSecret(sessionSecret: string): Promise<boolean> {
  const config = getAppwriteSessionValidationConfig();
  if (!config) {
    return false;
  }

  const cacheKey = `${config.projectId}:${sessionSecret}`;
  const cached = sessionValidationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.valid;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${config.endpoint}/account`, {
      method: "GET",
      headers: {
        "X-Appwrite-Project": config.projectId,
        "X-Appwrite-Session": sessionSecret,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const valid = response.ok;
    pruneSessionCache();
    sessionValidationCache.set(cacheKey, {
      valid,
      expiresAt: Date.now() + SESSION_VALIDATION_CACHE_TTL_MS,
    });

    return valid;
  } catch {
    // Cache the failure for a shorter window so transient network blips
    // don't lock users out for 15 s
    sessionValidationCache.set(cacheKey, {
      valid: false,
      expiresAt: Date.now() + 3000,
    });

    return false;
  } finally {
    clearTimeout(timeout);
  }
}

const CSRF_ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "",
  "https://amarbhaiya.in",
  "https://www.amarbhaiya.in",
  "https://community.amarbhaiya.in",
  "https://app.amarbhaiya.in",
  "https://admin.amarbhaiya.in",
  "https://instructor.amarbhaiya.in",
  "https://moderator.amarbhaiya.in",
].filter(Boolean);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Server-to-server endpoints authenticated by their own signatures (HMAC
// webhooks, etc.) receive no Origin/Referer header and must bypass the
// browser CSRF origin gate.
const CSRF_BYPASS_PREFIXES = ["/api/payments/razorpay/webhook"];

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // ── CSRF origin validation for state-changing requests ─────────────────
  const isServerToServerEndpoint = CSRF_BYPASS_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  if (MUTATING_METHODS.has(request.method) && !isServerToServerEndpoint) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const source = origin ?? referer;

    if (!source) {
      return new NextResponse(null, { status: 403 });
    }

    try {
      const sourceUrl = new URL(source);
      const isAllowed = CSRF_ALLOWED_ORIGINS.some((allowed) => {
        if (!allowed) return false;
        try {
          const allowedUrl = new URL(allowed);
          return sourceUrl.origin === allowedUrl.origin;
        } catch {
          return false;
        }
      });

      if (!isAllowed) {
        return new NextResponse(null, { status: 403 });
      }
    } catch {
      return new NextResponse(null, { status: 400 });
    }
  }

  // Build the cookie name dynamically
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
  const sessionCookieName = `a_session_${projectId}`;
  const session = request.cookies.get(sessionCookieName);
  const sessionSecret = session?.value ?? "";
  const hasSessionSecret = sessionSecret.length > 0;

  // ── Subdomain routing: app/admin/instructor/moderator/community → prefix rewrite
  // All are optional — single domain amarbhaiya.in works without any subdomain DNS.
  // Detect app/admin/instructor/moderator via exact host or prefix (covers preview deployments community-xxx.vercel.app etc. not needed).
  const subdomainPrefix = (() => {
    if (hostname === APP_HOST || hostname.startsWith("app.")) return "/app";
    if (hostname === ADMIN_HOST || hostname.startsWith("admin.")) return "/admin";
    if (hostname === INSTRUCTOR_HOST || hostname.startsWith("instructor.")) return "/instructor";
    if (hostname === MODERATOR_HOST || hostname.startsWith("moderator.")) return "/moderator";
    return null;
  })();

  if (subdomainPrefix) {
    // Let static assets and APIs pass through without rewrite
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Auth routes on subdomains: allow /login etc. without prefix, but redirect logged-in users
    const isSubAuthRoute = AUTH_ROUTES.some((r) => pathname === r);
    if (isSubAuthRoute) {
      if (hasSessionSecret) {
        const isValidSession = await validateAppwriteSessionSecret(sessionSecret);
        if (isValidSession) {
          const redirectTarget = request.nextUrl.searchParams.get("redirect");
          if (
            typeof redirectTarget === "string" &&
            redirectTarget.startsWith("/") &&
            !redirectTarget.startsWith("//") &&
            !redirectTarget.includes("\\")
          ) {
            return NextResponse.redirect(new URL(redirectTarget, request.url));
          }
          const fallback = subdomainPrefix === "/app" ? "/app/dashboard" : subdomainPrefix;
          return NextResponse.redirect(new URL(fallback, request.url));
        }
      }
      return NextResponse.next();
    }

    // Require auth for protected subdomains (app/admin/etc. are all protected)
    if (!hasSessionSecret) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    {
      const isValidSession = await validateAppwriteSessionSecret(sessionSecret);
      if (!isValidSession) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", `${pathname}${search}`);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete(sessionCookieName);
        return response;
      }
    }

    // Rewrite: app.amarbhaiya.in/ → /app, /courses → /app/courses, etc.
    // Root "/" maps to the subdomain's dashboard/index
    if (pathname === "/") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = subdomainPrefix === "/app" ? "/app/dashboard" : subdomainPrefix;
      return NextResponse.rewrite(rewriteUrl);
    }

    // If path already starts with the prefix, don't double-prefix
    if (pathname.startsWith(subdomainPrefix + "/") || pathname === subdomainPrefix) {
      return NextResponse.next();
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `${subdomainPrefix}${pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // ── Community subdomain → rewrite to /app/community ─────────────────
  if (hostname === COMMUNITY_HOST || hostname.startsWith("community.")) {
    // Let static assets pass through
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    const isCommunityAuthRoute = AUTH_ROUTES.some((r) => pathname === r);
    if (isCommunityAuthRoute) {
      if (hasSessionSecret) {
        const isValidSession = await validateAppwriteSessionSecret(sessionSecret);
        if (!isValidSession) {
          return NextResponse.next();
        }

        const redirectTarget = request.nextUrl.searchParams.get("redirect");
        if (
          typeof redirectTarget === "string" &&
          redirectTarget.startsWith("/") &&
          !redirectTarget.startsWith("//") &&
          !redirectTarget.includes("\\")
        ) {
          return NextResponse.redirect(new URL(redirectTarget, request.url));
        }

        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    }

    // Check auth — community requires login (validate session, not just cookie presence)
    if (!hasSessionSecret) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    {
      const isValidSession = await validateAppwriteSessionSecret(sessionSecret);
      if (!isValidSession) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", `${pathname}${search}`);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete(sessionCookieName);
        return response;
      }
    }

    // Rewrite root → /app/community
    if (pathname === "/") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/app/community";
      return NextResponse.rewrite(rewriteUrl);
    }

    // Rewrite /anything → /app/community/anything
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/app/community${pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // ── Protected routes → validate session, not just cookie presence ─────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);

  if (isProtected) {
    if (!hasSessionSecret) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // Actually validate the session against Appwrite (cached 15s)
    const isValidSession = await validateAppwriteSessionSecret(sessionSecret);
    if (!isValidSession) {
      // Expired/invalid cookie → clear it and redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(sessionCookieName);
      return response;
    }
  }

  // ── Auth routes → redirect to dashboard if already logged in ──────────
  if (isAuthRoute && hasSessionSecret) {
    const isValidSession = await validateAppwriteSessionSecret(sessionSecret);
    if (!isValidSession) {
      return NextResponse.next();
    }

    const redirectTarget = request.nextUrl.searchParams.get("redirect");
    if (
      typeof redirectTarget === "string" &&
      redirectTarget.startsWith("/") &&
      !redirectTarget.startsWith("//") &&
      !redirectTarget.includes("\\")
    ) {
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }

    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all protected and auth routes
    "/app/:path*",
    "/instructor/:path*",
    "/moderator/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    // Catch-all for subdomain routing
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
