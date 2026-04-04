import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/appwrite/auth";
import { proxyAppwriteBucketFile } from "@/lib/appwrite/file-proxy";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireAuth().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avatarFileId = String(user.prefs?.avatarFileId ?? "");
  if (!avatarFileId) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }

  return proxyAppwriteBucketFile({
    request,
    bucketId: APPWRITE_CONFIG.buckets.userAvatars,
    fileId: avatarFileId,
    mode: "view",
  });
}
