import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/app", "/instructor", "/moderator", "/admin"];

// Routes that should redirect logged-in users away
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// Community subdomain hostname
const COMMUNITY_HOST = "community.amarbhaiya.in";

const SESSION_VALIDATION_CACHE_TTL_MS = 30 * 1000;

const sessionValidationCache = new Map<
  string,
  { valid: boolean; expiresAt: number }
>();

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
    sessionValidationCache.set(cacheKey, {
      valid,
      expiresAt: Date.now() + SESSION_VALIDATION_CACHE_TTL_MS,
    });

    return valid;
  } catch {
    sessionValidationCache.set(cacheKey, {
      valid: false,
      expiresAt: Date.now() + SESSION_VALIDATION_CACHE_TTL_MS,
    });

    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Build the cookie name dynamically
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
  const sessionCookieName = `a_session_${projectId}`;
  const session = request.cookies.get(sessionCookieName);
  const sessionSecret = session?.value ?? "";
  const hasSessionSecret = sessionSecret.length > 0;

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

    const isLoggedIn = hasSessionSecret;

    const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);
    if (isAuthRoute) {
      if (hasSessionSecret) {
        const isValidSession = await validateAppwriteSessionSecret(sessionSecret);
        if (!isValidSession) {
          return NextResponse.next();
        }

        const redirectTarget = request.nextUrl.searchParams.get("redirect");
        if (
          typeof redirectTarget === "string" &&
          redirectTarget.startsWith("/") &&
          !redirectTarget.startsWith("//")
        ) {
          return NextResponse.redirect(new URL(redirectTarget, request.url));
        }

        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    }

    // Check auth — community requires login
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
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

    // Actually validate the session against Appwrite (cached 30s)
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
      !redirectTarget.startsWith("//")
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
