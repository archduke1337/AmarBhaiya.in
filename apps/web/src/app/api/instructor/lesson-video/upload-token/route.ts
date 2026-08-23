import { NextResponse } from "next/server";
import { z } from "zod";

import { getManageableLessonVideoTarget } from "@/server/appwrite/lesson-video-upload";
import { getAuthenticatedManager } from "@/server/appwrite/api-auth";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";

export const runtime = "nodejs";

const uploadTokenSchema = z.object({
  courseId: z.string().trim().min(1),
  lessonId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const rlKey = `${getRateLimitKey(request)}:lesson-video-token`;
  const rateLimit = await checkRateLimit(rlKey, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const authenticated = await getAuthenticatedManager();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (authenticated.role !== "admin" && authenticated.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = uploadTokenSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const target = await getManageableLessonVideoTarget({
    courseId: parsed.data.courseId,
    lessonId: parsed.data.lessonId,
    userId: authenticated.user.$id,
    role: authenticated.role,
  });

  if (!target) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const jwt = await authenticated.account.createJWT();
    return NextResponse.json({ jwt: jwt.jwt });
  } catch (error) {
    console.error("[Lesson Video Upload Token]", error);
    return NextResponse.json(
      { error: "Failed to create upload token." },
      { status: 500 }
    );
  }
}
