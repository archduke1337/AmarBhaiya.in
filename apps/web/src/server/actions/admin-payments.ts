"use server";

import { revalidatePath } from "next/cache";

import { ID, Query } from "node-appwrite";
import { requireRole } from "@/server/appwrite/auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";
import { getRazorpayClient } from "@/server/payments/razorpay";
import { createNotificationEntry } from "@/server/actions/notifications";
import { reconcileCoursePayment } from "@/server/payments/course-payment";

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

    // Validate transitions — mirrors the canonical state machine in
    // server/payments/course-payment.ts (canTransitionPaymentStatus)
    const validTransitions: Record<string, string[]> = {
      pending: ["completed", "failed"],
      completed: ["refunded"],
      failed: [],
      refunded: [],
    };

    const allowed = validTransitions[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      return actionError(`Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(", ") || "none"}.`);
    }

    const reconciliation = await reconcileCoursePayment({
      tablesDB,
      providerRef: String(existing.providerRef ?? paymentId),
      providerPaymentId: String(existing.providerPaymentId ?? "") || null,
      status: newStatus as "pending" | "completed" | "failed" | "refunded",
      userId: String(existing.userId ?? "") || null,
      courseId: String(existing.courseId ?? "") || null,
      amount: Number(existing.amount ?? 0),
      currency: String(existing.currency ?? "INR"),
    });

    if (!reconciliation.paymentFound) {
      return actionError("Payment record could not be reconciled.");
    }

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

/**
 * Process a refund via Razorpay API and update the payment status.
 * Requires the payment to have a valid providerRef (Razorpay payment ID).
 */
export async function processRefundAction(formData: FormData): Promise<ActionResult<string>> {
  await requireRole(["admin"]);

  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const amountStr = String(formData.get("amount") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!paymentId) {
    return actionError("Payment ID is required.");
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
    if (currentStatus !== "completed") {
      return actionError(`Cannot refund a payment with status "${currentStatus}". Only completed payments can be refunded.`);
    }

    const providerPaymentId = String(existing.providerPaymentId ?? "");
    if (!providerPaymentId) {
      return actionError("No Razorpay payment ID found. This payment must be reconciled before it can be refunded.");
    }

    const originalAmount = Number(existing.amount ?? 0);
    const requestedAmount = amountStr ? Number(amountStr) * 100 : originalAmount;
    if (!Number.isFinite(requestedAmount) || requestedAmount !== originalAmount) {
      return actionError("Only full refunds are supported. Enter the exact original payment amount.");
    }

    // Process refund via Razorpay
    let refundResult: Record<string, unknown> | null = null;
    try {
      const razorpay = getRazorpayClient();
      const refundOptions: Record<string, unknown> = {
        notes: {
          reason: reason || "Admin-initiated refund",
          adminRefund: "true",
        },
      };

      // Omitting amount requests a full refund from Razorpay.

      refundResult = await razorpay.payments.refund(providerPaymentId, refundOptions) as unknown as Record<string, unknown>;
    } catch (razorpayError) {
      const message = razorpayError instanceof Error ? razorpayError.message : "Razorpay refund failed";
      return actionError(`Razorpay refund failed: ${message}`);
    }

    // Update payment status to refunded
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      data: {
        status: "refunded",
        updatedAt: new Date().toISOString(),
        refundId: String((refundResult as Record<string, unknown>)?.id ?? ""),
        refundAmount: Number((refundResult as Record<string, unknown>)?.amount ?? originalAmount),
      },
    });

    // Deactivate enrollment
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
        // Non-critical
      }
    }

    // Notify the user about the refund
    try {
      await createNotificationEntry({
        userId,
        type: "payment.refunded",
        title: "Payment Refunded",
        body: `Your payment of ₹${originalAmount / 100} has been refunded. Refund ID: ${String((refundResult as Record<string, unknown>)?.id ?? "N/A")}. The amount will be credited to your original payment method within 5-10 business days.`,
        link: "/app/billing",
      });
    } catch {
      // Non-critical
    }

    // Write audit log
    try {
      const { user } = await requireRole(["admin"]);
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.auditLogs,
        rowId: ID.unique(),
        data: {
          actorId: user.$id,
          actorName: user.name || "Admin",
          action: "payment.refunded",
          entity: "payment",
          entityId: paymentId,
          metadata: JSON.stringify({
            previousStatus: currentStatus,
            newStatus: "refunded",
            amount: existing.amount,
            refundId: String((refundResult as Record<string, unknown>)?.id ?? ""),
            refundAmount: Number((refundResult as Record<string, unknown>)?.amount ?? 0),
            reason: reason || "Admin-initiated refund",
            courseId: existing.courseId,
            userId: existing.userId,
          }),
          createdAt: new Date().toISOString(),
        },
      });
    } catch {
      // Non-critical
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    revalidatePath("/app/billing");

    return actionSuccess(`Refund processed successfully. Refund ID: ${String((refundResult as Record<string, unknown>)?.id ?? "N/A")}`);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Failed to process refund.");
  }
}

/**
 * Send a payment reminder notification to a user with a pending/failed payment.
 */
export async function sendPaymentReminderAction(formData: FormData): Promise<ActionResult<string>> {
  await requireRole(["admin"]);

  const paymentId = String(formData.get("paymentId") ?? "").trim();

  if (!paymentId) {
    return actionError("Payment ID is required.");
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
    if (currentStatus !== "pending" && currentStatus !== "failed") {
      return actionError(`Cannot send reminder for a payment with status "${currentStatus}". Only pending or failed payments qualify.`);
    }

    const userId = String(existing.userId ?? "");
    const courseId = String(existing.courseId ?? "");
    const amount = Number(existing.amount ?? 0) / 100;

    if (!userId) {
      return actionError("No user associated with this payment.");
    }

    // Resolve course title
    let courseTitle = "your course";
    if (courseId) {
      try {
        const courseRow = await tablesDB.getRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          rowId: courseId,
        }).catch(() => null) as Record<string, unknown> | null;
        if (courseRow && typeof courseRow.title === "string") {
          courseTitle = courseRow.title;
        }
      } catch {
        // Use default
      }
    }

    const reminderMessage = currentStatus === "pending"
      ? `Hi! This is a friendly reminder that your payment of ₹${amount} for "${courseTitle}" is still pending. Please complete the payment to access your course content.`
      : `Hi! Your previous payment of ₹${amount} for "${courseTitle}" did not go through. Please try purchasing the course again to continue learning.`;

    await createNotificationEntry({
      userId,
      type: "payment.reminder",
      title: currentStatus === "pending" ? "Payment Pending — Reminder" : "Payment Failed — Please Retry",
      body: reminderMessage,
      link: `/courses/${courseId}`,
    });

    // Write audit log
    try {
      const { user } = await requireRole(["admin"]);
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.auditLogs,
        rowId: ID.unique(),
        data: {
          actorId: user.$id,
          actorName: user.name || "Admin",
          action: "payment.reminder_sent",
          entity: "payment",
          entityId: paymentId,
          metadata: JSON.stringify({
            paymentStatus: currentStatus,
            amount: existing.amount,
            courseId,
            userId,
          }),
          createdAt: new Date().toISOString(),
        },
      });
    } catch {
      // Non-critical
    }

    revalidatePath("/admin/payments");

    return actionSuccess("Payment reminder sent successfully.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Failed to send payment reminder.");
  }
}
