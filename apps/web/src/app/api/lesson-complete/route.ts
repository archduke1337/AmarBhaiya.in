import { NextResponse } from "next/server";
import { z } from "zod";

import { completeLessonForUser } from "@/server/actions/progress";
import { userHasCourseAccess } from "@/server/appwrite/access";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";
import { createSessionClient } from "@/server/appwrite/server";

export const runtime = "nodejs";

const lessonCompleteSchema = z.object({
  courseId: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
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
    const status = result.code === "PAID_COURSE" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true });
}
