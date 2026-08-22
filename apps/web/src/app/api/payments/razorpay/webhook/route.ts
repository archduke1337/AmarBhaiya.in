import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { reconcileCoursePayment } from "@/server/payments/course-payment";
import { verifyRazorpayWebhookSignature } from "@/server/payments/razorpay";
import { revalidateEach } from "@/lib/utils/revalidate";

export const runtime = "nodejs";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

type RazorpayPaymentEntity = {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  notes?: Record<string, string>;
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

    const providerRef = payment.order_id ?? payment.id;
    const status = mapRazorpayStatus(event, payment.status);
    const notes = payment.notes ?? {};
    const userId = notes.userId;
    const courseId = notes.courseId;

    const { tablesDB } = await createAdminClient();

    // Idempotency: skip if this providerRef (the Razorpay order id stored on
    // the payment row at creation time) has already reached a terminal state.
    const existingPayments = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [
        Query.equal("providerRef", [providerRef]),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    });
    const alreadyProcessed = existingPayments.rows.some((row) => {
      const r = row as { status?: string };
      return r.status === "completed" || r.status === "refunded";
    });
    if (alreadyProcessed) {
      return NextResponse.json({ received: true, status, idempotent: true });
    }

    const result = await reconcileCoursePayment({
      tablesDB,
      providerRef,
      status,
      userId,
      courseId,
      accessModel: notes.accessModel,
      amount: payment.amount,
      currency: payment.currency,
    });

    // Critical: if payment was captured but no local row exists, return 500 so Razorpay retries
    // instead of silently dropping the paid enrollment.
    if (!result.paymentFound && status === "completed") {
      console.error(`[Razorpay Webhook] No local payment row for providerRef ${providerRef} — returning 500 for retry`);
      return NextResponse.json(
        { error: "Payment row not found, retry later" },
        { status: 500 }
      );
    }

    // Coupon usage: webhook is authoritative — increment here if completed and not idempotent
    // (verify route also increments, but only when transitioning from pending → completed, so at most one will succeed)
    if (result.paymentFound && result.finalStatus === "completed" && status === "completed") {
      try {
        const paymentRow = existingPayments.rows[0] as { couponCode?: string } | undefined;
        const couponCode = typeof paymentRow?.couponCode === "string" ? paymentRow.couponCode : "";
        if (couponCode) {
          const { incrementCouponUsageAction } = await import("@/server/actions/coupons");
          await incrementCouponUsageAction(couponCode).catch(() => {});
        }
      } catch {
        // non-critical
      }
    }

    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    revalidatePath("/instructor");
    revalidatePath("/instructor/earnings");

    if (result.courseId) {
      revalidateEach(getCourseDetailPaths(result.courseId, result.courseSlug ?? ""));
    }

    return NextResponse.json({ received: true, status });
  } catch (error) {
    console.error("[Razorpay Webhook]", error);
    return NextResponse.json(
      { error: "Failed to process Razorpay webhook." },
      { status: 500 }
    );
  }
}
