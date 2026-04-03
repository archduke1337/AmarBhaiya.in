import { NextResponse } from "next/server";

import { getUserRole } from "@/lib/appwrite/auth-utils";
import { userCanManageCourse } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { proxyAppwriteBucketFile } from "@/lib/appwrite/file-proxy";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

type AnyRow = Record<string, unknown> & { $id: string };

async function getAuthenticatedUserContext() {
  try {
    const { account } = await createSessionClient();
    const sessionUser = await account.get();
    const { users } = await createAdminClient();
    const adminUser = await users.get({ userId: sessionUser.$id });

    return {
      userId: sessionUser.$id,
      role: getUserRole(adminUser),
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ submissionId: string }> }
) {
  const authenticated = await getAuthenticatedUserContext();
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
