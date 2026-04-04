import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/appwrite/server";
import { reconcileCoursePayment } from "@/lib/payments/course-payment";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";

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

    await reconcileCoursePayment({
      tablesDB,
      providerRef,
      status,
      userId,
      courseId,
      accessModel: notes.accessModel,
      amount: payment.amount,
      currency: payment.currency,
    });

    return NextResponse.json({ received: true, status });
  } catch (error) {
    console.error("[Razorpay Webhook]", error);
    return NextResponse.json(
      { error: "Failed to process Razorpay webhook." },
      { status: 500 }
    );
  }
}
