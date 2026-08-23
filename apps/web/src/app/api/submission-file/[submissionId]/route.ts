import { NextResponse } from "next/server";

import { getApiUserContext } from "@/server/appwrite/api-auth";
import { userCanManageCourse } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { proxyAppwriteBucketFile } from "@/server/appwrite/file-proxy";
import { createAdminClient } from "@/server/appwrite/server";
import type { AnyRow } from "@/types/rows";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ submissionId: string }> }
) {
  const authenticated = await getApiUserContext();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await context.params;
  const { tablesDB } = await createAdminClient();

  const submission = (await tablesDB
    .getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.submissions,
      rowId: submissionId,
    })
    .catch(() => null)) as AnyRow | null;

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const fileId = String(submission.fileId ?? "");
  if (!fileId) {
    return NextResponse.json({ error: "Submission file not found" }, { status: 404 });
  }

  const isOwner = String(submission.userId ?? "") === authenticated.userId;

  let canManageCourse = false;
  if (!isOwner && authenticated.role !== "student") {
    const assignment = (await tablesDB
      .getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.assignments,
        rowId: String(submission.assignmentId ?? ""),
      })
      .catch(() => null)) as AnyRow | null;

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    canManageCourse = Boolean(
      await userCanManageCourse(
        String(assignment.courseId ?? ""),
        authenticated.role,
        authenticated.userId
      )
    );
  }

  if (!isOwner && !canManageCourse) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shouldDownload = new URL(request.url).searchParams.get("download") === "1";

  return proxyAppwriteBucketFile({
    request,
    bucketId: APPWRITE_CONFIG.buckets.courseResources,
    fileId,
    mode: shouldDownload ? "download" : "view",
  });
}
