import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/app", "/instructor", "/moderator", "/admin"];

// Routes that should redirect logged-in users away
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build the cookie name dynamically
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
  const sessionCookieName = `a_session_${projectId}`;
  const session = request.cookies.get(sessionCookieName);
  const isLoggedIn = !!session?.value;

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
  ],
};
