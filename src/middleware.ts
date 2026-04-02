import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/app", "/admin", "/instructor", "/moderator"];

// Routes that should redirect authenticated users to dashboard
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// API routes that don't need session check (webhooks use their own auth)
const PUBLIC_API_PREFIXES = [
  "/api/payments/razorpay/webhook",
  "/api/payments/phonepe/webhook",
  "/api/content",
];

function getSessionCookie(request: NextRequest): string | undefined {
  // Match the Appwrite session cookie pattern
  const cookies = request.cookies.getAll();
  const sessionCookie = cookies.find((c) => c.name.startsWith("a_session_"));
  return sessionCookie?.value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionCookie(request);

  // Skip public API routes (webhooks have their own signature verification)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && session) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  // Protect dashboard routes - redirect to login if no session
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
