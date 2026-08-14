"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/server/appwrite/auth";
import { userHasCourseAccess } from "@/server/appwrite/access";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { executeDeletePlan } from "@/server/appwrite/delete-plan";
import { createAdminClient, createSessionClient } from "@/server/appwrite/server";
import { passwordSchema } from "@/server/validators/auth";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { handleActionError } from "@/lib/errors/error-handler";

type AnyRow = Record<string, unknown> & { $id: string };

async function getLiveSessionRow(sessionId: string): Promise<AnyRow | null> {
  const { tablesDB } = await createAdminClient();

  try {
    return (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.liveSessions,
      rowId: sessionId,
    })) as AnyRow;
  } catch {
    return null;
  }
}

// ── RSVP to Live Session ────────────────────────────────────────────────────

export async function rsvpToSessionAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) {
    return actionError("Session ID is required.");
  }

  try {
    const session = await getLiveSessionRow(sessionId);
    if (!session) {
      return actionError("Live session not found.");
    }

    const courseId = String(session.courseId ?? "");
    const status = String(session.status ?? "scheduled");
    if (!courseId || !["scheduled", "live"].includes(status)) {
      return actionError("Session is not available for RSVP.");
    }
    if (!(await userHasCourseAccess({ courseId, userId: user.$id }))) {
      return actionError("You do not have access to this course.");
    }

    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.sessionRsvps,
      rowId: ID.unique(),
      data: {
        sessionId,
        userId: user.$id,
        rsvpedAt: new Date().toISOString(),
      },
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/live");
    return actionSuccess();
  } catch (error) {
    const appwriteError = error as { code?: number };
    if (appwriteError?.code === 409) {
      revalidatePath("/app/dashboard");
      revalidatePath("/app/live");
      return actionError("You already RSVPed to this session.");
    }

    return actionError(handleActionError(error, { category: "DATABASE", action: "rsvpToSession", userId: user.$id }));
  }
}

// ── Cancel RSVP ─────────────────────────────────────────────────────────────

export async function cancelRsvpAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) {
    return actionError("Session ID is required.");
  }

  try {
    const { tablesDB, storage } = await createAdminClient();

    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.sessionRsvps,
      queries: [
        Query.equal("sessionId", [sessionId]),
        Query.equal("userId", [user.$id]),
        Query.limit(1),
      ],
    });

    const rsvp = existing.rows[0] as { $id: string } | undefined;
    if (!rsvp) {
      return actionError("RSVP not found.");
    }

    const deleted = await executeDeletePlan({
      tablesDB,
      storage,
      plan: {
        stagedDeletes: [
          {
            tableId: APPWRITE_CONFIG.tables.sessionRsvps,
            rowId: rsvp.$id,
          },
        ],
        fileDeletes: [],
      },
      label: `session RSVP ${rsvp.$id}`,
    });
    if (!deleted) {
      return actionError("Failed to cancel RSVP.");
    }

    revalidatePath("/app/dashboard");
    revalidatePath("/app/live");
    return actionSuccess();
  } catch (error) {
    return actionError(handleActionError(error, { category: "DATABASE", action: "cancelRsvp", userId: user.$id }));
  }
}

// ── Change Password ─────────────────────────────────────────────────────────

export async function changePasswordAction(
  formData: FormData
): Promise<ActionResult> {
  await requireAuth();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();
  const parsedPassword = passwordSchema.safeParse(newPassword);

  if (!currentPassword) {
    return actionError("Current password is required.");
  }
  if (!parsedPassword.success) {
    const issues = parsedPassword.error.issues.map((i) => i.message).join(", ");
    return actionError(issues);
  }
  if (parsedPassword.data !== confirmPassword) {
    return actionError("Passwords do not match.");
  }

  try {
    const { account } = await createSessionClient();
    await account.updatePassword({
      password: parsedPassword.data,
      oldPassword: currentPassword,
    });
    return actionSuccess();
  } catch (error) {
    return actionError(handleActionError(error, { category: "AUTHENTICATION", action: "changePassword" }));
  }
}

// ── Update Display Name ─────────────────────────────────────────────────────

export async function updateDisplayNameAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length < 2) {
    return actionError("Name must be at least 2 characters.");
  }

  try {
    const { account } = await createSessionClient();
    await account.updateName({ name });
    revalidatePath("/app/profile/edit");
    revalidatePath("/app/dashboard");
    revalidatePath(`/app/profile/${user.$id}`);
    return actionSuccess();
  } catch (error) {
    return actionError(handleActionError(error, { category: "DATABASE", action: "updateDisplayName", userId: user.$id }));
  }
}
