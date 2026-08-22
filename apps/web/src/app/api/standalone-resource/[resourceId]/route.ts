import { NextResponse } from "next/server";

import { getApiUser } from "@/server/appwrite/api-auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { proxyAppwriteBucketFile } from "@/server/appwrite/file-proxy";
import { createAdminClient } from "@/server/appwrite/server";
import type { AnyRow } from "@/types/rows";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resourceId } = await context.params;
  const { tablesDB } = await createAdminClient();

  const resource = (await tablesDB
    .getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.standaloneResources,
      rowId: resourceId,
    })
    .catch(() => null)) as AnyRow | null;

  if (!resource || resource.isPublished === false) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const fileId = String(resource.fileId ?? "");
  if (!fileId) {
    return NextResponse.json({ error: "Resource file not found" }, { status: 404 });
  }

  // Paid resources have no purchase/entitlement flow yet — refuse direct
  // downloads so the file URLs never leak for revenue-protected content.
  if (String(resource.accessModel ?? "free") === "paid") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shouldDownload = new URL(request.url).searchParams.get("download") === "1";

  return proxyAppwriteBucketFile({
    request,
    bucketId: APPWRITE_CONFIG.buckets.resourceFiles,
    fileId,
    mode: shouldDownload ? "download" : "view",
  });
}