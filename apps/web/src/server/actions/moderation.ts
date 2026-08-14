"use server";

import { ID } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/server/appwrite/auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

const applyModerationSchema = z.object({
  targetUserId: z.string().trim().min(1),
  targetUserName: z.string().trim().optional(),
  action: z.enum([
    "warn",
    "mute",
    "timeout",
    "delete_post",
    "pin",
    "unpin",
    "remove_from_chat",
    "flag",
  ]),
  scope: z.enum(["course", "platform"]),
  reason: z.string().trim().min(3),
  duration: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
});

const resolveModerationSchema = z.object({
  actionId: z.string().trim().min(1),
});

export async function applyModerationActionAction(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole(["admin", "moderator"]);

  const parsed = applyModerationSchema.safeParse({
    targetUserId: String(formData.get("targetUserId") ?? ""),
    targetUserName: String(formData.get("targetUserName") ?? "") || undefined,
    action: String(formData.get("action") ?? "warn"),
    scope: String(formData.get("scope") ?? "platform"),
    reason: String(formData.get("reason") ?? ""),
    duration: String(formData.get("duration") ?? "") || undefined,
    entityType: String(formData.get("entityType") ?? "") || undefined,
    entityId: String(formData.get("entityId") ?? "") || undefined,
  });

  if (!parsed.success) {
    return actionError("Invalid input: targetUserId and reason are required");
  }

  if (parsed.data.targetUserId === user.$id) {
    return actionError("You cannot moderate yourself");
  }

  const entityType = parsed.data.entityType;
  const entityId = parsed.data.entityId;
  const isThreadAction =
    typeof entityType === "string" &&
    entityType.toLowerCase().includes("thread") &&
    typeof entityId === "string" &&
    entityId.length > 0;

  if ((parsed.data.action === "pin" || parsed.data.action === "unpin") && !isThreadAction) {
    return actionError("Pin/unpin action requires a valid thread entity");
  }

  const { tablesDB, users } = await createAdminClient();

  let targetUserName = parsed.data.targetUserName || parsed.data.targetUserId;
  try {
    const targetUser = await users.get({ userId: parsed.data.targetUserId });
    targetUserName = targetUser.name || targetUser.email || targetUserName;
  } catch {
    // Fall back to the submitted display name when the user record is unavailable.
  }

  await tablesDB.createRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.moderationActions,
    rowId: ID.unique(),
    data: {
      moderatorId: user.$id,
      moderatorName: user.name,
      targetUserId: parsed.data.targetUserId,
      targetUserName,
      action: parsed.data.action,
      scope: parsed.data.scope,
      reason: parsed.data.reason,
      duration: parsed.data.duration || "",
      entityType: parsed.data.entityType || "",
      entityId: parsed.data.entityId || "",
      createdAt: new Date().toISOString(),
      revertedBy: "",
    },
  });

  if (isThreadAction && (parsed.data.action === "pin" || parsed.data.action === "unpin")) {
    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.forumThreads,
        rowId: entityId,
        data: {
          isPinned: parsed.data.action === "pin",
        },
      });
    } catch {
      // Ignore thread pin sync failures and keep moderation action record.
    }
  }

  revalidatePath("/moderator/reports");
  revalidatePath("/moderator");
  revalidatePath("/moderator/community");
  revalidatePath("/moderator/students");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");

  return actionSuccess();
}

export async function resolveModerationActionAction(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole(["admin", "moderator"]);

  const parsed = resolveModerationSchema.safeParse({
    actionId: String(formData.get("actionId") ?? ""),
  });

  if (!parsed.success) {
    return actionError("Invalid input: actionId is required");
  }

  const { tablesDB } = await createAdminClient();

  await tablesDB.updateRow({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.moderationActions,
    rowId: parsed.data.actionId,
    data: {
      revertedBy: user.$id,
      revertedAt: new Date().toISOString(),
    },
  });

  revalidatePath("/moderator/reports");
  revalidatePath("/moderator");
  revalidatePath("/moderator/students");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");

  return actionSuccess();
}
