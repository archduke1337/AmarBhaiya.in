import { NextRequest, NextResponse } from "next/server";
import { OAuthProvider } from "node-appwrite";
import { createPublicClient } from "@/server/appwrite/server";

export const runtime = "nodejs";

const OAUTH_MAP: Record<string, OAuthProvider> = {
  google: OAuthProvider.Google,
  github: OAuthProvider.Github,
  facebook: OAuthProvider.Facebook,
  apple: OAuthProvider.Apple,
  microsoft: OAuthProvider.Microsoft,
  discord: OAuthProvider.Discord,
  slack: OAuthProvider.Slack,
};

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");
  const redirect = request.nextUrl.searchParams.get("redirect") ?? "/app/dashboard";
  // sanitize redirect now (defense in depth) - block // and \, must start with /
  const sanitizedRedirect = redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.includes("\\") ? redirect : "/app/dashboard";

  if (!provider || !OAUTH_MAP[provider]) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "invalid_oauth_provider");
    return NextResponse.redirect(url);
  }

  try {
    const { account } = await createPublicClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in";
    // Generate state for CSRF protection (bound to redirect)
    const state = Buffer.from(JSON.stringify({ r: sanitizedRedirect, t: Date.now() })).toString("base64url");

    const oauthUrl = await account.createOAuth2Token({
      provider: OAUTH_MAP[provider],
      success: `${appUrl}/api/auth/oauth?redirect=${encodeURIComponent(sanitizedRedirect)}&state=${encodeURIComponent(state)}`,
      failure: `${appUrl}/login?error=oauth_failed`,
    });

    const response = NextResponse.redirect(oauthUrl);
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "oauth_init_failed");
    return NextResponse.redirect(url);
  }
}
