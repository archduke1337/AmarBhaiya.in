import { Account, Client } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { buildSessionCookieOptions } from "@/lib/appwrite/session-cookie";

export const runtime = "nodejs";

function getSafeRedirectPath(request: NextRequest): string {
  const redirect = request.nextUrl.searchParams.get("redirect");

  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
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

  if (!userId || !secret) {
    return createLoginRedirect(request, "oauth_callback_invalid");
  }

  try {
    const client = new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId);

    const account = new Account(client);
    const session = await account.createSession({ userId, secret });

    const response = NextResponse.redirect(
      new URL(getSafeRedirectPath(request), request.url)
    );

    response.cookies.set(APPWRITE_CONFIG.sessionCookieName, session.secret, {
      ...buildSessionCookieOptions({
        expire: session.expire,
        host: request.headers.get("host"),
      }),
    });

    return response;
  } catch {
    return createLoginRedirect(request, "oauth_callback_failed");
  }
}
