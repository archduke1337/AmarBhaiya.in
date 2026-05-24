"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/appwrite/auth";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { executeDeletePlan } from "@/lib/appwrite/delete-plan";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { passwordSchema } from "@/lib/validators/auth";
import { actionSuccess, actionError } from "@/lib/errors/action-result";
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
): Promise<void> {
  const user = await requireAuth();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) {
    actionError("Session ID is required.");
    return;
  }

  try {
    const session = await getLiveSessionRow(sessionId);
    if (!session) {
      actionError("Live session not found.");
      return;
    }

    const courseId = String(session.courseId ?? "");
    const status = String(session.status ?? "scheduled");
    if (!courseId || !["scheduled", "live"].includes(status)) {
      actionError("Session is not available for RSVP.");
      return;
    }
    if (!(await userHasCourseAccess({ courseId, userId: user.$id }))) {
      actionError("You do not have access to this course.");
      return;
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
    actionSuccess();
    return;
  } catch (error) {
    const appwriteError = error as { code?: number };
    if (appwriteError?.code === 409) {
      revalidatePath("/app/dashboard");
      revalidatePath("/app/live");
      actionError("You already RSVPed to this session.");
      return;
    }

    actionError(handleActionError(error, { category: "DATABASE", action: "rsvpToSession", userId: user.$id }));
    return;
  }
}

// ── Cancel RSVP ─────────────────────────────────────────────────────────────

export async function cancelRsvpAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) {
    actionError("Session ID is required.");
    return;
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
      actionError("RSVP not found.");
      return;
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
      actionError("Failed to cancel RSVP.");
      return;
    }

    revalidatePath("/app/dashboard");
    revalidatePath("/app/live");
    actionSuccess();
    return;
  } catch (error) {
    actionError(handleActionError(error, { category: "DATABASE", action: "cancelRsvp", userId: user.$id }));
    return;
  }
}

// ── Change Password ─────────────────────────────────────────────────────────

export async function changePasswordAction(
  formData: FormData
): Promise<void> {
  await requireAuth();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();
  const parsedPassword = passwordSchema.safeParse(newPassword);

  if (!currentPassword) {
    actionError("Current password is required.");
    return;
  }
  if (!parsedPassword.success) {
    const issues = parsedPassword.error.issues.map((i) => i.message).join(", ");
    actionError(issues);
    return;
  }
  if (parsedPassword.data !== confirmPassword) {
    actionError("Passwords do not match.");
    return;
  }

  try {
    const { account } = await createSessionClient();
    await account.updatePassword({
      password: parsedPassword.data,
      oldPassword: currentPassword,
    });
    actionSuccess();
    return;
  } catch (error) {
    actionError(handleActionError(error, { category: "AUTHENTICATION", action: "changePassword" }));
    return;
  }
}

// ── Update Display Name ─────────────────────────────────────────────────────

export async function updateDisplayNameAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length < 2) {
    actionError("Name must be at least 2 characters.");
    return;
  }

  try {
    const { account } = await createSessionClient();
    await account.updateName({ name });
    revalidatePath("/app/profile/edit");
    revalidatePath("/app/dashboard");
    revalidatePath(`/app/profile/${user.$id}`);
    actionSuccess();
    return;
  } catch (error) {
    actionError(handleActionError(error, { category: "DATABASE", action: "updateDisplayName", userId: user.$id }));
    return;
  }
}
