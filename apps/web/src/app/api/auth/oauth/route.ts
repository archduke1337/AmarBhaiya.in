import { NextRequest, NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { buildSessionCookieOptions } from "@/server/appwrite/session-cookie";
import { createPublicClient } from "@/server/appwrite/server";

export const runtime = "nodejs";

function sanitizeRedirectPath(redirect: string | null): string {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//") || redirect.includes("\\")) {
    return "/app/dashboard";
  }
  return redirect;
}

function createLoginRedirect(request: NextRequest, errorCode: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", errorCode);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const secret = request.nextUrl.searchParams.get("secret");
  // Verify OAuth state if present (CSRF protection)
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("oauth_state")?.value;
  if (state && cookieState && state !== cookieState) {
    return createLoginRedirect(request, "oauth_state_mismatch");
  }
  const redirectPath = sanitizeRedirectPath(
    request.nextUrl.searchParams.get("redirect")
  );

  if (!userId || !secret) {
    return createLoginRedirect(request, "oauth_callback_invalid");
  }

  try {
    const { account } = await createPublicClient();
    const session = await account.createSession({ userId, secret });

    if (!session.secret) {
      return createLoginRedirect(request, "oauth_callback_failed");
    }

    const response = NextResponse.redirect(
      new URL(redirectPath, request.url)
    );

    response.cookies.set(APPWRITE_CONFIG.sessionCookieName, session.secret, {
      ...buildSessionCookieOptions({
        expire: session.expire,
        host: request.headers.get("host"),
      }),
    });
    // clear state cookie
    response.cookies.delete("oauth_state");

    return response;
  } catch {
    return createLoginRedirect(request, "oauth_callback_failed");
  }
}
