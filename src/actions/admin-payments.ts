"use server";

import { revalidatePath } from "next/cache";

import { ID, Query } from "node-appwrite";
import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

/**
 * Update a payment's status manually from the admin panel.
 * Valid transitions: pending→completed, pending→failed, completed→refunded
 */
export async function updatePaymentStatusAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const newStatus = String(formData.get("status") ?? "").trim();

  if (!paymentId || !newStatus) {
    return actionError("Payment ID and status are required.");
  }

  const validStatuses = ["pending", "completed", "failed", "refunded"];
  if (!validStatuses.includes(newStatus)) {
    return actionError("Invalid status. Must be: pending, completed, failed, or refunded.");
  }

  const { tablesDB } = await createAdminClient();

  try {
    const existing = await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
    }).catch(() => null) as Record<string, unknown> | null;

    if (!existing) {
      return actionError("Payment record not found.");
    }

    const currentStatus = String(existing.status ?? "");

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      pending: ["completed", "failed"],
      completed: ["refunded"],
      failed: ["pending"],
      refunded: [],
    };

    const allowed = validTransitions[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      return actionError(`Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(", ") || "none"}.`);
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      data: {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      },
    });

    // If refunding a completed payment, also deactivate the enrollment
    if (newStatus === "refunded" && currentStatus === "completed") {
      const courseId = String(existing.courseId ?? "");
      const userId = String(existing.userId ?? "");
      if (courseId && userId) {
        try {
          const enrollments = await tablesDB.listRows({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId: APPWRITE_CONFIG.tables.enrollments,
            queries: [
              Query.equal("courseId", [courseId]),
              Query.equal("userId", [userId]),
              Query.equal("isActive", [true]),
            ],
          });

          for (const enrollment of enrollments.rows) {
            await tablesDB.updateRow({
              databaseId: APPWRITE_CONFIG.databaseId,
              tableId: APPWRITE_CONFIG.tables.enrollments,
              rowId: enrollment.$id,
              data: {
                isActive: false,
                status: "cancelled",
              },
            });
          }
        } catch {
          // Non-critical - enrollment deactivation is best-effort
        }
      }
    }

    // ── Write audit log ────────────────────────────────────────────────────
    try {
      const { user } = await requireRole(["admin"]);
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.auditLogs,
        rowId: ID.unique(),
        data: {
          actorId: user.$id,
          actorName: user.name || "Admin",
          action: `payment.${newStatus}`,
          entity: "payment",
          entityId: paymentId,
          metadata: JSON.stringify({
            previousStatus: currentStatus,
            newStatus,
            amount: existing.amount,
            courseId: existing.courseId,
            userId: existing.userId,
          }),
          createdAt: new Date().toISOString(),
        },
      });
    } catch {
      // Non-critical — audit log failure shouldn't block the operation
    }

    // Revalidate payment-related paths
    revalidatePath("/admin/payments");
    revalidatePath("/admin");

    return actionSuccess();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Failed to update payment status.");
  }
}
