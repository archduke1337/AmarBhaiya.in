"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/appwrite/auth";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { passwordSchema } from "@/lib/validators/auth";

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
  if (!sessionId) return;

  try {
    const session = await getLiveSessionRow(sessionId);
    if (!session) return;

    const courseId = String(session.courseId ?? "");
    const status = String(session.status ?? "scheduled");
    if (!courseId || !["scheduled", "live"].includes(status)) return;
    if (!(await userHasCourseAccess({ courseId, userId: user.$id }))) return;

    const { tablesDB } = await createAdminClient();

    // Check if already RSVPed
    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.sessionRsvps,
      queries: [
        Query.equal("sessionId", [sessionId]),
        Query.equal("userId", [user.$id]),
        Query.limit(1),
      ],
    });

    if (existing.rows.length > 0) return; // Already RSVPed

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
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to RSVP."
    );
  }
}

// ── Cancel RSVP ─────────────────────────────────────────────────────────────

export async function cancelRsvpAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  try {
    const { tablesDB } = await createAdminClient();

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
    if (!rsvp) return;

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.sessionRsvps,
      rowId: rsvp.$id,
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/live");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to cancel RSVP."
    );
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

  if (!currentPassword || !parsedPassword.success) return;
  if (parsedPassword.data !== confirmPassword) return;

  try {
    const { account } = await createSessionClient();
    await account.updatePassword({
      password: parsedPassword.data,
      oldPassword: currentPassword,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to change password."
    );
  }
}

// ── Update Display Name ─────────────────────────────────────────────────────

export async function updateDisplayNameAction(
  formData: FormData
): Promise<void> {
  await requireAuth();

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length < 2) return;

  try {
    const { account } = await createSessionClient();
    await account.updateName({ name });
    revalidatePath("/app/profile/edit");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to update name."
    );
  }
}
