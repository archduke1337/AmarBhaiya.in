import { ID, Query } from "node-appwrite";
import { NextResponse } from "next/server";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  decodePhonePeWebhookBody,
  verifyPhonePeWebhookSignature,
} from "@/lib/payments/phonepe";

export const runtime = "nodejs";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

type PaymentRow = {
  $id: string;
  userId?: string;
  courseId?: string;
};

type PhonePeWebhookDecoded = {
  code?: string;
  data?: {
    merchantTransactionId?: string;
    amount?: number;
    state?: string;
  };
};

function mapPhonePeStatus(decoded: PhonePeWebhookDecoded): PaymentStatus {
  const state = decoded.data?.state;

  if (state === "COMPLETED" || decoded.code === "PAYMENT_SUCCESS") {
    return "completed";
  }

  if (state === "FAILED" || decoded.code === "PAYMENT_ERROR") {
    return "failed";
  }

  if (state === "REFUNDED") {
    return "refunded";
  }

  return "pending";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-verify") ?? "";

  if (!verifyPhonePeWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const decoded = decodePhonePeWebhookBody(rawBody) as PhonePeWebhookDecoded | null;
    const providerRef = decoded?.data?.merchantTransactionId;

    if (!decoded || !providerRef) {
      return NextResponse.json({ received: true });
    }

    const status = mapPhonePeStatus(decoded);
    const { tablesDB } = await createAdminClient();

    const paymentRows = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [Query.equal("providerRef", [providerRef]), Query.limit(1)],
    });

    const existingPayment = paymentRows.rows[0] as PaymentRow | undefined;

    if (!existingPayment) {
      return NextResponse.json({ received: true, status });
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: existingPayment.$id,
      data: {
        status,
        amount: decoded.data?.amount,
        currency: "INR",
      },
    });

    if (status === "completed" && existingPayment.userId && existingPayment.courseId) {
      try {
        await tablesDB.createRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.enrollments,
          rowId: ID.unique(),
          data: {
            userId: existingPayment.userId,
            courseId: existingPayment.courseId,
            enrolledAt: new Date().toISOString(),
            paymentId: existingPayment.$id,
            accessModel: "paid",
            isActive: true,
          },
        });
      } catch (error) {
        const appwriteError = error as { code?: number };
        if (appwriteError.code !== 409) {
          throw error;
        }
      }
    }

    return NextResponse.json({ received: true, status });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process PhonePe webhook.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
