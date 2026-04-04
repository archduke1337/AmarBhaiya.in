import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { reconcileCoursePayment } from "@/lib/payments/course-payment";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/razorpay";

export const runtime = "nodejs";

const verifyPaymentSchema = z.object({
  courseId: z.string().min(1).optional(),
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

type PaymentRow = {
  $id: string;
  userId?: string;
  courseId?: string;
  amount?: number;
  currency?: string;
};

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
  const parsed = verifyPaymentSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  if (
    !verifyRazorpayPaymentSignature({
      orderId: parsed.data.orderId,
      paymentId: parsed.data.paymentId,
      signature: parsed.data.signature,
    })
  ) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  try {
    const { tablesDB } = await createAdminClient();
    const paymentRows = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [Query.equal("providerRef", [parsed.data.orderId]), Query.limit(1)],
    });

    const existingPayment = paymentRows.rows[0] as PaymentRow | undefined;
    if (
      typeof existingPayment?.userId === "string" &&
      existingPayment.userId.length > 0 &&
      existingPayment.userId !== user.$id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await reconcileCoursePayment({
      tablesDB,
      providerRef: parsed.data.orderId,
      status: "completed",
      userId: user.$id,
      courseId:
        (typeof existingPayment?.courseId === "string" && existingPayment.courseId.length > 0
          ? existingPayment.courseId
          : parsed.data.courseId) ?? null,
      amount: typeof existingPayment?.amount === "number" ? existingPayment.amount : null,
      currency:
        typeof existingPayment?.currency === "string" && existingPayment.currency.length > 0
          ? existingPayment.currency
          : "INR",
    });

    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    revalidatePath("/instructor");
    revalidatePath("/instructor/earnings");

    if (result.courseId) {
      revalidatePath(`/app/courses/${result.courseId}`);
    }

    if (result.courseSlug) {
      revalidatePath(`/courses/${result.courseSlug}`);
    }

    return NextResponse.json({
      success: true,
      courseId: result.courseId,
      courseSlug: result.courseSlug,
      enrollmentCreated: result.enrollmentCreated,
      enrollmentUpdated: result.enrollmentUpdated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify Razorpay payment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
