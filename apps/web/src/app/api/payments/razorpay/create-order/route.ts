import { ID, Query } from "node-appwrite";
import { NextResponse } from "next/server";
import { z } from "zod";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { isActiveEnrollmentRow } from "@/server/appwrite/dashboard-data/internal";
import { createAdminClient } from "@/server/appwrite/server";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";
import {
  createRazorpayOrder,
  getRazorpayPublicKey,
} from "@/server/payments/razorpay";

export const runtime = "nodejs";

import { validateCouponAction } from "@/server/actions/coupons";

import { getApiUser } from "@/server/appwrite/api-auth";

const createOrderSchema = z.object({
  courseId: z.string().min(1),
  currency: z.string().length(3).default("INR").transform((v) => v.toUpperCase()).refine((v) => v === "INR", { message: "Only INR is supported" }),
  couponCode: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rlKey = `${getRateLimitKey(request)}:create-order:${user.$id}`;
  const rateLimit = await checkRateLimit(rlKey, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
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
    type CourseRow = { price?: number; accessModel?: string; isPublished?: boolean };
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

    if (course.isPublished === false) {
      return NextResponse.json(
        { error: "Course not available" },
        { status: 404 }
      );
    }

    const enrollments = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [parsed.data.courseId]),
        Query.equal("userId", [user.$id]),
        Query.limit(10),
      ],
    });

    const hasActiveEnrollment = enrollments.rows.some((row) => isActiveEnrollmentRow(row as unknown as Parameters<typeof isActiveEnrollmentRow>[0]));

    if (hasActiveEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this course." },
        { status: 409 }
      );
    }

    const price = Number(course.price ?? 0);
    if (price <= 0 || course.accessModel === "free") {
      return NextResponse.json(
        { error: "This course does not require payment" },
        { status: 400 }
      );
    }

    // Apply coupon if provided
    let finalPrice = price;
    let discountAmount = 0;
    let appliedCouponCode = "";

    if (parsed.data.couponCode) {
      const couponResult = await validateCouponAction(
        parsed.data.couponCode,
        parsed.data.courseId
      );
      if (couponResult.valid && couponResult.finalAmount !== undefined) {
        finalPrice = couponResult.finalAmount;
        discountAmount = couponResult.discountAmount ?? 0;
        appliedCouponCode = parsed.data.couponCode.toUpperCase();
      } else {
        // Invalid coupon — still proceed but without discount
        console.warn("Invalid coupon:", couponResult.message);
      }
    }

    // Amount in paise (smallest currency unit)
    const amountInPaise = finalPrice * 100;
    const receipt = `r_${Date.now()}_${user.$id.slice(0, 8)}`;

    const order = await createRazorpayOrder({
      amount: amountInPaise,
      currency: parsed.data.currency,
      receipt,
      notes: {
        userId: user.$id,
        courseId: parsed.data.courseId,
        accessModel: String(course.accessModel ?? "paid"),
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
        couponCode: appliedCouponCode || null,
        originalAmount: price * 100,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      keyId: getRazorpayPublicKey(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId,
      couponApplied: !!appliedCouponCode,
      discountAmount,
    });
  } catch (error) {
    console.error("[Razorpay Create Order]", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}
