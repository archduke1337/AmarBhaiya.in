import { NextResponse } from "next/server";

import { getUserRole } from "@/lib/appwrite/auth-utils";
import { userCanManageLesson, userHasCourseAccess } from "@/lib/appwrite/access";
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
  context: { params: Promise<{ resourceId: string }> }
) {
  const authenticated = await getAuthenticatedUserContext();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resourceId } = await context.params;
  const { tablesDB } = await createAdminClient();

  const resource = (await tablesDB
    .getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.resources,
      rowId: resourceId,
    })
    .catch(() => null)) as AnyRow | null;

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const lessonId = String(resource.lessonId ?? "");
  const fileId = String(resource.fileId ?? "");
  if (!lessonId || !fileId) {
    return NextResponse.json({ error: "Resource file not found" }, { status: 404 });
  }

  const lesson = (await tablesDB
    .getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
    })
    .catch(() => null)) as AnyRow | null;

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const courseId = String(lesson.courseId ?? "");
  const hasCourseAccess = await userHasCourseAccess({
    courseId,
    userId: authenticated.userId,
    lessonId,
  });

  let canManageLesson = false;
  if (!hasCourseAccess && authenticated.role !== "student") {
    canManageLesson = Boolean(
      await userCanManageLesson(lessonId, authenticated.role, authenticated.userId)
    );
  }

  if (!hasCourseAccess && !canManageLesson) {
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
