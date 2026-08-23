import { NextResponse } from "next/server";

import { setSessionCookie } from "@/server/appwrite/session-cookie";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";
import { createPublicClient } from "@/server/appwrite/server";
import { validateOrigin } from "@/server/csrf";
import { loginSchema } from "@/server/validators/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

  const rlKey = `${getRateLimitKey(request)}:login`;
  const rateLimit = await checkRateLimit(rlKey, 5);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    const { account } = await createPublicClient();
    const session = await account.createEmailPasswordSession({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!session.secret) {
      throw new Error("Missing Appwrite session secret.");
    }

    const response = NextResponse.json({ success: true });
    setSessionCookie(request, response, session.secret, session.expire);
    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed. Please try again.";
    console.error("[Login] failure:", message, error instanceof Error ? error.stack : error);

    if (message.toLowerCase().includes("invalid credentials")) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Temporary detailed error for Vercel debugging — remove after fix
    return NextResponse.json(
      { error: `Login failed: ${message}` },
      { status: 500 }
    );
  }
}
