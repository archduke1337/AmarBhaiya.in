import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { reconcileCoursePayment } from "@/server/payments/course-payment";
import { recordCouponUsageForPayment } from "@/server/payments/coupon-usage";
import {
  getRazorpayClient,
  verifyRazorpayWebhookSignature,
} from "@/server/payments/razorpay";
import { revalidateEach } from "@/lib/utils/revalidate";

export const runtime = "nodejs";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

type RazorpayPaymentEntity = {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  refund_status?: "null" | "partial" | "full";
  amount_refunded?: number;
  notes?: Record<string, string>;
};

type RazorpayRefundEntity = {
  id?: string;
  payment_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
};

function mapRazorpayStatus(event: string, paymentStatus?: string): PaymentStatus {
  // Event names are authoritative. A fetched payment can still be reported
  // as captured while its refund webhook is being delivered.
  if (
    event === "payment.refunded" ||
    event === "refund.created" ||
    event === "refund.processed"
  ) {
    return "refunded";
  }

  if (event === "payment.captured" || paymentStatus === "captured") {
    return "completed";
  }

  if (event === "payment.failed" || paymentStatus === "failed") {
    return "failed";
  }

  return "pending";
}

function parseWebhookPayment(rawBody: string): {
  event: string;
  payment: RazorpayPaymentEntity | null;
  refund: RazorpayRefundEntity | null;
} {
  const parsed = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      payment?: { entity?: RazorpayPaymentEntity };
      refund?: { entity?: RazorpayRefundEntity };
    };
  };

  return {
    event: parsed.event ?? "",
    payment: parsed.payload?.payment?.entity ?? null,
    refund: parsed.payload?.refund?.entity ?? null,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const { event, payment: payloadPayment, refund } = parseWebhookPayment(rawBody);
    const providerPaymentId = payloadPayment?.id ?? refund?.payment_id ?? null;
    let payment = payloadPayment;

    // Refund payloads commonly contain only payment_id. Fetch the provider
    // payment so legacy local rows can still be resolved by their order ID.
    if (providerPaymentId && (!payment?.order_id || event.startsWith("refund."))) {
      try {
        const providerPayment = await getRazorpayClient().payments.fetch(providerPaymentId);
        payment = {
          ...payment,
          id: providerPayment.id,
          order_id: providerPayment.order_id,
          amount: Number(providerPayment.amount),
          currency: providerPayment.currency,
          status: providerPayment.status,
          refund_status: providerPayment.refund_status,
          amount_refunded: providerPayment.amount_refunded,
          notes: providerPayment.notes as Record<string, string> | undefined,
        };
      } catch (error) {
        if (!payment?.order_id) {
          console.warn(
            `[Razorpay Webhook] Could not fetch payment ${providerPaymentId}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
    }

    const providerRef = payment?.order_id ?? refund?.order_id ?? providerPaymentId;
    if (!providerRef) {
      return NextResponse.json({ received: true });
    }

    const status = mapRazorpayStatus(event, payment?.status);
    if (
      status === "refunded" &&
      payment?.refund_status !== "full" &&
      !(typeof refund?.amount === "number" && typeof payment?.amount === "number" && refund.amount >= payment.amount) &&
      !(typeof payment?.amount_refunded === "number" && typeof payment?.amount === "number" && payment.amount_refunded >= payment.amount)
    ) {
      // A partial refund must not revoke course access in a full-refund-only model.
      return NextResponse.json({ received: true, status: "partial_refund_ignored" });
    }

    const notes = payment?.notes ?? {};
    const userId = notes.userId;
    const courseId = notes.courseId;

    const { tablesDB } = await createAdminClient();

    const result = await reconcileCoursePayment({
      tablesDB,
      providerRef,
      providerPaymentId,
      status,
      userId,
      courseId,
      accessModel: notes.accessModel,
      amount: payment?.amount ?? refund?.amount,
      currency: payment?.currency ?? refund?.currency,
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

    // Coupon redemption is payment-scoped and safe to retry.
    if (result.paymentId && result.finalStatus === "completed" && status === "completed") {
      const paymentRow = (await tablesDB
        .getRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.payments,
          rowId: result.paymentId,
        })
        .catch(() => null)) as { couponCode?: string } | null;
      const couponCode = typeof paymentRow?.couponCode === "string" ? paymentRow.couponCode : "";
      if (couponCode) {
        await recordCouponUsageForPayment(tablesDB, {
          paymentId: result.paymentId,
          couponCode,
        }).catch(() => undefined);
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
