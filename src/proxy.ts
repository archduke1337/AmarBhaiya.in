import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/app", "/instructor", "/moderator", "/admin"];

// Routes that should redirect logged-in users away
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// Community subdomain hostname
const COMMUNITY_HOST = "community.amarbhaiya.in";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Build the cookie name dynamically
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
  const sessionCookieName = `a_session_${projectId}`;
  const session = request.cookies.get(sessionCookieName);
  const isLoggedIn = !!session?.value;

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

    // Check auth — community requires login
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Rewrite root → /app/community
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/app/community", request.url));
    }

    // Rewrite /anything → /app/community/anything
    return NextResponse.rewrite(
      new URL(`/app/community${pathname}`, request.url)
    );
  }

  // ── Protected routes → redirect to login if not authenticated ─────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Auth routes → redirect to dashboard if already logged in ──────────
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);
  if (isAuthRoute && isLoggedIn) {
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