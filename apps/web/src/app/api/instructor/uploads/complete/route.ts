import { NextResponse } from "next/server";
import { z } from "zod";

import { finalizeInstructorUpload } from "@/server/appwrite/instructor-file-upload";
import { getAuthenticatedManager } from "@/server/appwrite/api-auth";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";

export const runtime = "nodejs";

const completeUploadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("course-thumbnail"),
    courseId: z.string().trim().min(1),
    fileId: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("standalone-resource"),
    resourceId: z.string().trim().min(1),
    fileId: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("course-resource"),
    resourceId: z.string().trim().min(1),
    fileId: z.string().trim().min(1),
  }),
]);

export async function POST(request: Request) {
  const rlKey = `${getRateLimitKey(request)}:instructor-upload-complete`;
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
  const parsed = completeUploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await finalizeInstructorUpload({
    ...parsed.data,
    uploadedFileId: parsed.data.fileId,
    userId: authenticated.user.$id,
    role: authenticated.role,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
