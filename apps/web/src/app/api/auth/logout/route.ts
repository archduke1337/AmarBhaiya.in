import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { buildExpiredSessionCookieOptions } from "@/lib/appwrite/session-cookie";
import { createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession({ sessionId: "current" });
  } catch {
    // Ignore invalid or missing sessions; cookie cleanup still runs.
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(APPWRITE_CONFIG.sessionCookieName, "", {
    ...buildExpiredSessionCookieOptions({ host: request.headers.get("host") }),
  });

  return response;
}
