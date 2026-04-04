import { ID, Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import type { createAdminClient } from "@/lib/appwrite/server";

type TablesDbClient = Awaited<ReturnType<typeof createAdminClient>>["tablesDB"];

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

type AnyRow = Record<string, unknown> & { $id: string };
type PaymentRow = AnyRow & {
  userId?: string;
  courseId?: string;
  amount?: number;
  currency?: string;
  status?: string;
};
type EnrollmentRow = AnyRow & {
  paymentId?: string;
  accessModel?: string;
  isActive?: boolean;
  status?: string;
  enrolledAt?: string;
};
type CourseRow = AnyRow & {
  slug?: string;
  accessModel?: string;
  price?: number;
};

function normalizeAccessModel(
  value: string | null | undefined
): "free" | "paid" | "subscription" {
  if (value === "free" || value === "subscription") {
    return value;
  }

  return "paid";
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function reconcileCoursePayment({
  tablesDB,
  providerRef,
  status,
  userId,
  courseId,
  accessModel,
  amount,
  currency,
}: {
  tablesDB: TablesDbClient;
  providerRef: string;
  status: PaymentStatus;
  userId?: string | null;
  courseId?: string | null;
  accessModel?: string | null;
  amount?: number | null;
  currency?: string | null;
}): Promise<{
  paymentId: string | null;
  courseId: string | null;
  courseSlug: string | null;
  enrollmentCreated: boolean;
  enrollmentUpdated: boolean;
}> {
  const paymentRows = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.payments,
    queries: [Query.equal("providerRef", [providerRef]), Query.limit(1)],
  });

  const existingPayment = paymentRows.rows[0] as PaymentRow | undefined;
  let paymentId = existingPayment?.$id ?? null;
  const resolvedUserId =
    typeof existingPayment?.userId === "string" && existingPayment.userId.length > 0
      ? existingPayment.userId
      : userId ?? null;
  const resolvedCourseId =
    typeof existingPayment?.courseId === "string" && existingPayment.courseId.length > 0
      ? existingPayment.courseId
      : courseId ?? null;
  let resolvedAmount =
    toNumberOrNull(existingPayment?.amount) ?? toNumberOrNull(amount) ?? null;
  const resolvedCurrency =
    typeof existingPayment?.currency === "string" && existingPayment.currency.length > 0
      ? existingPayment.currency
      : currency ?? "INR";
  let resolvedAccessModel = normalizeAccessModel(accessModel);
  let courseSlug: string | null = null;

  if (resolvedCourseId) {
    const course = (await tablesDB
      .getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: resolvedCourseId,
      })
      .catch(() => null)) as CourseRow | null;

    if (course) {
      courseSlug =
        typeof course.slug === "string" && course.slug.length > 0 ? course.slug : course.$id;
      resolvedAccessModel = normalizeAccessModel(
        typeof course.accessModel === "string" ? course.accessModel : resolvedAccessModel
      );

      if (resolvedAmount === null) {
        const coursePrice = toNumberOrNull(course.price) ?? 0;
        resolvedAmount = Math.max(0, Math.round(coursePrice * 100));
      }
    }
  }

  if (existingPayment) {
    const paymentData: Record<string, unknown> = {
      status,
      currency: resolvedCurrency,
    };

    if (resolvedAmount !== null) {
      paymentData.amount = resolvedAmount;
    }

    if (
      (typeof existingPayment.userId !== "string" || existingPayment.userId.length === 0) &&
      typeof resolvedUserId === "string" &&
      resolvedUserId.length > 0
    ) {
      paymentData.userId = resolvedUserId;
    }

    if (
      (typeof existingPayment.courseId !== "string" || existingPayment.courseId.length === 0) &&
      typeof resolvedCourseId === "string" &&
      resolvedCourseId.length > 0
    ) {
      paymentData.courseId = resolvedCourseId;
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: existingPayment.$id,
      data: paymentData,
    });
  } else if (resolvedUserId && resolvedCourseId) {
    paymentId = ID.unique();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      data: {
        userId: resolvedUserId,
        courseId: resolvedCourseId,
        amount: resolvedAmount ?? 0,
        currency: resolvedCurrency,
        method: "razorpay",
        status,
        providerRef,
        createdAt: new Date().toISOString(),
      },
    });
  }

  let enrollmentCreated = false;
  let enrollmentUpdated = false;

  if (status === "completed" && resolvedUserId && resolvedCourseId) {
    const enrollments = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("userId", [resolvedUserId]),
        Query.equal("courseId", [resolvedCourseId]),
        Query.limit(1),
      ],
    });

    const existingEnrollment = enrollments.rows[0] as EnrollmentRow | undefined;
    const nextPaymentId = paymentId ?? providerRef;

    if (existingEnrollment) {
      const nextStatus = String(existingEnrollment.status ?? "active") === "completed"
        ? "completed"
        : "active";

      const shouldUpdate =
        existingEnrollment.isActive === false ||
        String(existingEnrollment.paymentId ?? "") !== nextPaymentId ||
        String(existingEnrollment.accessModel ?? "") !== resolvedAccessModel ||
        String(existingEnrollment.status ?? "active") !== nextStatus;

      if (shouldUpdate) {
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.enrollments,
          rowId: existingEnrollment.$id,
          data: {
            paymentId: nextPaymentId,
            accessModel: resolvedAccessModel,
            isActive: true,
            status: nextStatus,
          },
        });
        enrollmentUpdated = true;
      }
    } else {
      await tablesDB.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.enrollments,
        rowId: ID.unique(),
        data: {
          userId: resolvedUserId,
          courseId: resolvedCourseId,
          enrolledAt: new Date().toISOString(),
          paymentId: nextPaymentId,
          accessModel: resolvedAccessModel,
          isActive: true,
          completedLessons: 0,
          progress: 0,
          completedAt: "",
          status: "active",
        },
      });
      enrollmentCreated = true;
    }
  }

  return {
    paymentId,
    courseId: resolvedCourseId,
    courseSlug,
    enrollmentCreated,
    enrollmentUpdated,
  };
}
