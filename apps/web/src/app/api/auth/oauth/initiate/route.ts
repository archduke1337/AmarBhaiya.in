import { NextRequest, NextResponse } from "next/server";
import { OAuthProvider } from "node-appwrite";
import { createAdminClient } from "@/server/appwrite/server";

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

  if (!provider || !OAUTH_MAP[provider]) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "invalid_oauth_provider");
    return NextResponse.redirect(url);
  }

  try {
    const { account } = await createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amarbhaiya.in";

    const oauthUrl = await account.createOAuth2Token({
      provider: OAUTH_MAP[provider],
      success: `${appUrl}/api/auth/oauth?redirect=${encodeURIComponent(redirect)}`,
      failure: `${appUrl}/login?error=oauth_failed`,
    });

    return NextResponse.redirect(oauthUrl);
  } catch {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "oauth_init_failed");
    return NextResponse.redirect(url);
  }
}
