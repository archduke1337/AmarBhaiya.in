import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserRole } from "@/lib/appwrite/auth-utils";
import { getManageableInstructorUploadTarget } from "@/lib/appwrite/instructor-file-upload";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

export const runtime = "nodejs";

const uploadTokenSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("course-thumbnail"),
    courseId: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("standalone-resource"),
    resourceId: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("course-resource"),
    resourceId: z.string().trim().min(1),
  }),
]);

async function getAuthenticatedManager() {
  try {
    const { account } = await createSessionClient();
    const sessionUser = await account.get();
    const { users } = await createAdminClient();
    const adminUser = await users.get({ userId: sessionUser.$id });
    const role = getUserRole(adminUser);

    return {
      account,
      user: {
        ...sessionUser,
        labels: Array.isArray(adminUser.labels) ? adminUser.labels : [],
      },
      role,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
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

  const target = await getManageableInstructorUploadTarget({
    ...parsed.data,
    userId: authenticated.user.$id,
    role: authenticated.role,
  });

  if (!target) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const jwt = await authenticated.account.createJWT();
    return NextResponse.json({
      jwt: jwt.jwt,
      bucketId: target.bucketId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create upload token.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
