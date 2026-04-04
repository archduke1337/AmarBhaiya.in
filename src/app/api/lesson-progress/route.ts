import { NextResponse } from "next/server";
import { z } from "zod";

import { userHasCourseAccess } from "@/lib/appwrite/access";
import { upsertLessonProgressRow } from "@/lib/appwrite/progress";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

const updateLessonProgressSchema = z.object({
  courseId: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
  percentComplete: z.number().min(0).max(100),
});

async function getAuthenticatedUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateLessonProgressSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { courseId, lessonId } = parsed.data;
  const percentComplete = Math.min(
    99,
    Math.max(0, Math.round(parsed.data.percentComplete))
  );

  const hasAccess = await userHasCourseAccess({
    courseId,
    userId: user.$id,
    lessonId,
  });
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { tablesDB } = await createAdminClient();
    const progressWrite = await upsertLessonProgressRow(tablesDB, {
      userId: user.$id,
      courseId,
      lessonId,
      percentComplete,
    });

    if (progressWrite.alreadyCompleted) {
      return NextResponse.json({ success: true, completed: true });
    }

    return NextResponse.json({
      success: true,
      percentComplete: progressWrite.percentComplete,
    });
  } catch (error) {
    console.error(
      "[Lesson Progress]",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Failed to save progress." },
      { status: 500 }
    );
  }
}
