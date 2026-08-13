import { ID } from "node-appwrite";
import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { buildSessionCookieOptions } from "@/lib/appwrite/session-cookie";
import {
  createAdminClient,
  createPublicClient,
} from "@/lib/appwrite/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { validateOrigin } from "@/lib/csrf";
import { registerSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";

function setSessionCookie(
  request: Request,
  response: NextResponse,
  secret: string,
  expire: string
) {
  response.cookies.set(APPWRITE_CONFIG.sessionCookieName, secret, {
    ...buildSessionCookieOptions({
      expire,
      host: request.headers.get("host"),
    }),
  });
}

export async function POST(request: Request) {
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

  const rlKey = `${getRateLimitKey(request)}:register`;
  const rateLimit = await checkRateLimit(rlKey, 3);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    const { account: publicAccount } = await createPublicClient();

    await publicAccount.create({
      userId: ID.unique(),
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });

    const { account } = await createAdminClient();
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
      error instanceof Error ? error.message : "Registration failed.";

    if (message.toLowerCase().includes("already exists")) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
