import { ID, Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { z } from "zod";

import { userHasCourseAccess } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

const updateLessonProgressSchema = z.object({
  courseId: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
  percentComplete: z.number().min(0).max(100),
});

type AnyRow = Record<string, unknown> & { $id: string };

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
    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.progress,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [user.$id]),
        Query.equal("lessonId", [lessonId]),
        Query.limit(1),
      ],
    });

    const row = (existing.rows[0] as AnyRow | undefined) ?? null;
    const existingPercent = row ? Number(row.percentComplete ?? 0) : 0;
    const completedAt =
      row && typeof row.completedAt === "string" ? row.completedAt.trim() : "";

    if (completedAt) {
      return NextResponse.json({ success: true, completed: true });
    }

    const nextPercent = Math.max(existingPercent, percentComplete);
    if (row) {
      if (nextPercent > existingPercent) {
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.progress,
          rowId: row.$id,
          data: {
            percentComplete: nextPercent,
          },
        });
      }
    } else {
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.progress,
        rowId: ID.unique(),
        data: {
          userId: user.$id,
          courseId,
          lessonId,
          completedAt: "",
          percentComplete: nextPercent,
        },
      });
    }

    return NextResponse.json({ success: true, percentComplete: nextPercent });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save progress.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
