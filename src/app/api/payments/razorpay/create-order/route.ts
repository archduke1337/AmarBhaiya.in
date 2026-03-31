import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { z } from "zod";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import {
  createRazorpayOrder,
  getRazorpayPublicKey,
} from "@/lib/payments/razorpay";

export const runtime = "nodejs";

const createOrderSchema = z.object({
  courseId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("INR"),
});

async function getAuthenticatedUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    const receipt = `r_${Date.now()}_${user.$id.slice(0, 8)}`;

    const order = await createRazorpayOrder({
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      receipt,
      notes: {
        userId: user.$id,
        courseId: parsed.data.courseId,
        accessModel: "paid",
      },
    });

    const paymentId = ID.unique();
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      data: {
        userId: user.$id,
        courseId: parsed.data.courseId,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        method: "razorpay",
        status: "pending",
        providerRef: order.id,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      keyId: getRazorpayPublicKey(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Razorpay order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
