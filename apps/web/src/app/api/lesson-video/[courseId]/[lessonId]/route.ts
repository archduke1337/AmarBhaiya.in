import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import { proxyAppwriteBucketFile } from "@/lib/appwrite/file-proxy";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

type AnyRow = Record<string, unknown> & { $id: string };

function getLessonVideoFileId(lesson: Record<string, unknown>): string {
  return String(lesson.videoFileId ?? lesson.videoId ?? lesson.fileId ?? "");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { courseId, lessonId } = await context.params;

  let sessionUserId = "";

  try {
    const { account } = await createSessionClient();
    const sessionUser = await account.get();
    sessionUserId = sessionUser.$id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await userHasCourseAccess({
    courseId,
    userId: sessionUserId,
    lessonId,
  });

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tablesDB } = await createAdminClient();
  const lesson = (await tablesDB
    .getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.lessons,
      rowId: lessonId,
    })
    .catch(() => null)) as AnyRow | null;

  if (!lesson || String(lesson.courseId ?? "") !== courseId) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const fileId = getLessonVideoFileId(lesson);
  if (!fileId) {
    return NextResponse.json({ error: "No video attached to this lesson" }, { status: 404 });
  }

  return proxyAppwriteBucketFile({
    request,
    bucketId: APPWRITE_CONFIG.buckets.courseVideos,
    fileId,
    mode: "view",
  });
}
