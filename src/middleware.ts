import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Community Subdomain Rewrite ─────────────────────────────────────────────
// community.amarbhaiya.in → /app/community (internally)
// This allows the community section to live on its own subdomain while
// sharing the same Next.js app and authentication.

const COMMUNITY_HOST = "community.amarbhaiya.in";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // ── Community subdomain routing ───────────────────────────────────────
  // Rewrite community.amarbhaiya.in/* → /app/community/*
  if (hostname === COMMUNITY_HOST || hostname.startsWith("community.")) {
    // Static assets and API routes should pass through
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/favicon") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Rewrite root → /app/community
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/app/community", request.url));
    }

    // Rewrite /thread-id → /app/community/thread-id
    return NextResponse.rewrite(
      new URL(`/app/community${pathname}`, request.url)
    );
  }

  // ── Auth-protected dashboard routes ───────────────────────────────────
  // The auth check happens inside each page via requireAuth/requireRole,
  // but we can add a quick cookie check here to redirect unauthenticated
  // users early, before the page starts rendering.
  const protectedPrefixes = ["/app", "/instructor", "/moderator", "/admin"];
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    // Check for session cookie
    const sessionCookie =
      request.cookies.get("amarbhaiya_session") ??
      request.cookies.get("a_session");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
