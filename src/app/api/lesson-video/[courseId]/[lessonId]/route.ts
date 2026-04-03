import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { userHasCourseAccess } from "@/lib/appwrite/access";
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

  const upstreamResponse = await fetch(
    `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.buckets.courseVideos}/files/${fileId}/view`,
    {
      method: "GET",
      headers: {
        "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
        "X-Appwrite-Key": process.env.APPWRITE_API_KEY ?? "",
        ...(request.headers.get("range")
          ? { Range: request.headers.get("range") as string }
          : {}),
      },
      cache: "no-store",
    }
  ).catch(() => null);

  if (!upstreamResponse) {
    return NextResponse.json({ error: "Failed to stream lesson video" }, { status: 502 });
  }

  if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
    const errorText = await upstreamResponse.text().catch(() => "");
    return NextResponse.json(
      {
        error: errorText || "Failed to stream lesson video",
      },
      { status: upstreamResponse.status }
    );
  }

  const headers = new Headers();
  const headerNames = [
    "accept-ranges",
    "cache-control",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
  ];

  for (const headerName of headerNames) {
    const value = upstreamResponse.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  headers.set("Content-Disposition", "inline");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
