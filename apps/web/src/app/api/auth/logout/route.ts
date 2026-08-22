import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { validateOrigin } from "@/server/csrf";
import { buildExpiredSessionCookieOptions } from "@/server/appwrite/session-cookie";
import { createSessionClient } from "@/server/appwrite/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

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
