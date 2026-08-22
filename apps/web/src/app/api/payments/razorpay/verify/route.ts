import { Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";
import { getCourseDetailPaths } from "@/lib/utils/cache-paths";
import { reconcileCoursePayment } from "@/server/payments/course-payment";
import { verifyRazorpayPaymentSignature } from "@/server/payments/razorpay";
import { revalidateEach } from "@/lib/utils/revalidate";
import { incrementCouponUsageAction } from "@/server/actions/coupons";

import { getApiUser } from "@/server/appwrite/api-auth";

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
  couponCode?: string | null;
};

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rlKey = `${getRateLimitKey(request)}:verify:${user.$id}`;
  const rateLimit = await checkRateLimit(rlKey, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
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

    // Increment coupon usage from the coupon recorded on the stored payment
    // row at order-creation time. Never trust a client-supplied coupon code
    // here — otherwise anyone could exhaust arbitrary coupon usage limits.
    // Idempotent: only increment when transitioning from non-completed → completed
    const shouldIncrementCoupon = existingStatus !== "completed" && existingStatus !== "refunded";
    const storedCouponCode =
      typeof existingPayment?.couponCode === "string" &&
      existingPayment.couponCode.length > 0
        ? existingPayment.couponCode
        : "";
    if (shouldIncrementCoupon && storedCouponCode) {
      await incrementCouponUsageAction(storedCouponCode).catch(() => {
        // Non-critical
      });
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
