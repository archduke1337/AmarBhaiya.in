import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
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
  status?: string;
};

async function getAuthenticatedUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

function revalidateEach(paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
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
      queries: [
        Query.equal("providerRef", [parsed.data.orderId]),
        Query.orderDesc("$createdAt"),
        Query.limit(2),
      ],
    });

    const existingPayment = paymentRows.rows[0] as PaymentRow | undefined;
    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment session not found." },
        { status: 404 }
      );
    }

    if (
      typeof existingPayment?.userId === "string" &&
      existingPayment.userId.length > 0 &&
      existingPayment.userId !== user.$id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingStatus =
      typeof existingPayment.status === "string" ? existingPayment.status : "pending";
    if (existingStatus === "failed" || existingStatus === "refunded") {
      return NextResponse.json(
        { error: "This payment can no longer be verified." },
        { status: 409 }
      );
    }

    const result = await reconcileCoursePayment({
      tablesDB,
      providerRef: parsed.data.orderId,
      status: "completed",
      userId: user.$id,
      courseId:
        (typeof existingPayment.courseId === "string" && existingPayment.courseId.length > 0
          ? existingPayment.courseId
          : null) ?? null,
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
      revalidateEach(getCourseDetailPaths(result.courseId, result.courseSlug ?? ""));
    }

    return NextResponse.json({
      success: true,
      courseId: result.courseId,
      courseSlug: result.courseSlug,
      enrollmentCreated: result.enrollmentCreated,
      enrollmentUpdated: result.enrollmentUpdated,
    });
  } catch (error) {
    console.error("[Razorpay Verify]", error);
    return NextResponse.json(
      { error: "Failed to verify Razorpay payment." },
      { status: 500 }
    );
  }
}
