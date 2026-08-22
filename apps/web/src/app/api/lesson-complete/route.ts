import { NextResponse } from "next/server";
import { z } from "zod";

import { completeLessonForUser } from "@/server/actions/progress";
import { userHasCourseAccess } from "@/server/appwrite/access";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";

import { getApiUser } from "@/server/appwrite/api-auth";

export const runtime = "nodejs";

const lessonCompleteSchema = z.object({
  courseId: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rlKey = `${getRateLimitKey(request)}:lesson-complete:${user.$id}`;
  const rateLimit = await checkRateLimit(rlKey, 30);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = lessonCompleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { courseId, lessonId } = parsed.data;
  const hasAccess = await userHasCourseAccess({
    courseId,
    userId: user.$id,
    lessonId,
  });

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await completeLessonForUser({
    courseId,
    lessonId,
    userId: user.$id,
  });

  if (!result.success) {
    // PAID_COURSE code is legacy dead branch — completeLessonForUser never sets it, but keep 403 mapping for future
    const status = result.code === "PAID_COURSE" ? 403 : 400;
    // Don't leak raw DB errors
    const safeError = result.error?.toLowerCase().includes("appwrite") || result.error?.toLowerCase().includes("document")
      ? "Failed to complete lesson"
      : result.error;
    return NextResponse.json({ error: safeError }, { status });
  }

  return NextResponse.json({ success: true });
}
