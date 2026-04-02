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
    const { tablesDB } = await createAdminClient();

    // SECURITY: Look up the actual course price from the database
    // Never trust client-provided amounts
    type CourseRow = { price?: number; accessModel?: string };
    let course: CourseRow;
    try {
      course = (await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: parsed.data.courseId,
      })) as CourseRow;
    } catch {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const price = Number(course.price ?? 0);
    if (price <= 0 || course.accessModel === "free") {
      return NextResponse.json(
        { error: "This course does not require payment" },
        { status: 400 }
      );
    }

    // Amount in paise (smallest currency unit)
    const amountInPaise = price * 100;
    const receipt = `r_${Date.now()}_${user.$id.slice(0, 8)}`;

    const order = await createRazorpayOrder({
      amount: amountInPaise,
      currency: parsed.data.currency,
      receipt,
      notes: {
        userId: user.$id,
        courseId: parsed.data.courseId,
        accessModel: "paid",
      },
    });

    const paymentId = ID.unique();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      data: {
        userId: user.$id,
        courseId: parsed.data.courseId,
        amount: amountInPaise,
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
