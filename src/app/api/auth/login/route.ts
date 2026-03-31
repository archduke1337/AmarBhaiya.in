import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { loginSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";

function setSessionCookie(response: NextResponse, secret: string, expire: string) {
  response.cookies.set(APPWRITE_CONFIG.sessionCookieName, secret, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expire),
  });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    const response = NextResponse.json({ success: true });
    setSessionCookie(response, session.secret, session.expire);
    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed. Please try again.";

    if (message.toLowerCase().includes("invalid credentials")) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}