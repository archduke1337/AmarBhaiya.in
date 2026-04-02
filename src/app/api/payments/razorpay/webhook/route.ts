import { ID, Query } from "node-appwrite";
import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { generateIdempotencyKey, isIdempotencyKeyProcessed } from "@/lib/utils/sanitize";

export const runtime = "nodejs";

// In-memory cache for processed idempotency keys (should be Redis in production)
const processedWebhooks = new Set<string>();

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

type RazorpayPaymentEntity = {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  notes?: Record<string, string>;
};

type PaymentRow = {
  $id: string;
  userId?: string;
  courseId?: string;
};

function mapRazorpayStatus(event: string, paymentStatus?: string): PaymentStatus {
  if (event === "payment.captured" || paymentStatus === "captured") {
    return "completed";
  }

  if (event === "payment.failed" || paymentStatus === "failed") {
    return "failed";
  }

  if (event === "payment.refunded") {
    return "refunded";
  }

  return "pending";
}

function parseWebhookPayment(rawBody: string): {
  event: string;
  payment: RazorpayPaymentEntity | null;
} {
  const parsed = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      payment?: {
        entity?: RazorpayPaymentEntity;
      };
    };
  };

  return {
    event: parsed.event ?? "",
    payment: parsed.payload?.payment?.entity ?? null,
  };
}

function normalizeAccessModel(value: string | undefined): "free" | "paid" | "subscription" {
  if (value === "free" || value === "subscription") {
    return value;
  }

  return "paid";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const { event, payment } = parseWebhookPayment(rawBody);

    if (!payment) {
      return NextResponse.json({ received: true });
    }

    // SECURITY: Check idempotency to prevent duplicate webhook processing
    // Razorpay webhooks can retry, so we need to prevent double-charging
    const eventId = payment.id || payment.order_id || "";
    const idempotencyKey = generateIdempotencyKey(eventId, event);

    if (isIdempotencyKeyProcessed(idempotencyKey, processedWebhooks)) {
      console.log("Webhook already processed, skipping:", idempotencyKey);
      return NextResponse.json({ received: true, duplicate: true });
    }

    const providerRef = payment.order_id ?? payment.id;
    const status = mapRazorpayStatus(event, payment.status);
    const notes = payment.notes ?? {};
    const userId = notes.userId;
    const courseId = notes.courseId;

    const { tablesDB } = await createAdminClient();

    const paymentRows = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [Query.equal("providerRef", [providerRef]), Query.limit(1)],
    });

    const existingPayment = paymentRows.rows[0] as PaymentRow | undefined;
    let paymentDocumentId = existingPayment?.$id ?? null;

    if (existingPayment) {
      // Update existing payment record
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.payments,
        rowId: existingPayment.$id,
        data: {
          status,
          amount: payment.amount,
          currency: payment.currency,
        },
      });
    } else if (userId && courseId) {
      // Create new payment record
      paymentDocumentId = ID.unique();
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.payments,
        rowId: paymentDocumentId,
        data: {
          userId,
          courseId,
          amount: payment.amount ?? 0,
          currency: payment.currency ?? "INR",
          method: "razorpay",
          status,
          providerRef,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Only create enrollment if payment completed and not already enrolled
    if (status === "completed") {
      const enrollmentUserId = existingPayment?.userId ?? userId;
      const enrollmentCourseId = existingPayment?.courseId ?? courseId;

      if (enrollmentUserId && enrollmentCourseId) {
        try {
          // Check if already enrolled (prevent duplicate enrollments)
          const existingEnrollment = await tablesDB.listRows({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId: APPWRITE_CONFIG.tables.enrollments,
            queries: [
              Query.equal("userId", [enrollmentUserId]),
              Query.equal("courseId", [enrollmentCourseId]),
              Query.limit(1),
            ],
          });

          // Only create if not already enrolled
          if (existingEnrollment.rows.length === 0) {
            await tablesDB.createRow({
              databaseId: APPWRITE_CONFIG.databaseId,
              tableId: APPWRITE_CONFIG.tables.enrollments,
              rowId: ID.unique(),
              data: {
                userId: enrollmentUserId,
                courseId: enrollmentCourseId,
                enrolledAt: new Date().toISOString(),
                paymentId: paymentDocumentId ?? providerRef,
                accessModel: normalizeAccessModel(notes.accessModel),
                isActive: true,
              },
            });
          }
        } catch (error) {
          const appwriteError = error as { code?: number };
          if (appwriteError.code !== 409) {
            throw error;
          }
        }
      }
    }

    // Mark this webhook as processed to prevent re-processing on retry
    processedWebhooks.add(idempotencyKey);

    return NextResponse.json({ received: true, status });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process Razorpay webhook.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
