import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession({ sessionId: "current" });
  } catch {
    // Ignore invalid or missing sessions; cookie cleanup still runs.
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(APPWRITE_CONFIG.sessionCookieName, "", {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });

  return response;
}