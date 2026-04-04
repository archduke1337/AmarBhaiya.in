import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

export async function POST() {
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
