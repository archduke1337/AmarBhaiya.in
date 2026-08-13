import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createSessionClient } from "@/lib/appwrite/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limiter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rlKey = `${getRateLimitKey(request)}:avatar-upload`;
  const rateLimit = await checkRateLimit(rlKey, 5);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { account } = await createSessionClient();
    await account.get();
    const jwt = await account.createJWT();

    return NextResponse.json({
      jwt: jwt.jwt,
      bucketId: APPWRITE_CONFIG.buckets.userAvatars,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
