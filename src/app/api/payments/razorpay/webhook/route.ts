import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
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

function revalidateEach(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
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

    // Idempotency: skip if this payment.id has already been processed
    const existingPayments = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [
        Query.equal("providerRef", [payment.id]),
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
