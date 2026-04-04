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

function normalizePaymentStatus(value: unknown): PaymentStatus | null {
  return value === "pending" ||
    value === "completed" ||
    value === "failed" ||
    value === "refunded"
    ? value
    : null;
}

function canTransitionPaymentStatus(
  currentStatus: PaymentStatus | null,
  nextStatus: PaymentStatus
): boolean {
  if (currentStatus === null) {
    return nextStatus === "pending";
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  switch (currentStatus) {
    case "pending":
      return nextStatus === "completed" || nextStatus === "failed" || nextStatus === "refunded";
    case "completed":
      return nextStatus === "refunded";
    case "failed":
      return false;
    case "refunded":
      return false;
    default:
      return false;
  }
}

function isEnrollmentActive(enrollment: EnrollmentRow): boolean {
  return enrollment.isActive !== false;
}

async function findPaymentsByProviderRef(
  tablesDB: TablesDbClient,
  providerRef: string
): Promise<PaymentRow[]> {
  const result = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.payments,
    queries: [
      Query.equal("providerRef", [providerRef]),
      Query.orderDesc("$createdAt"),
      Query.limit(2),
    ],
  });

  return result.rows as PaymentRow[];
}

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

async function findEnrollmentByUserAndCourse(
  tablesDB: TablesDbClient,
  userId: string,
  courseId: string
): Promise<EnrollmentRow | null> {
  const enrollments = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.enrollments,
    queries: [
      Query.equal("userId", [userId]),
      Query.equal("courseId", [courseId]),
      Query.limit(1),
    ],
  });

  return (enrollments.rows[0] as EnrollmentRow | undefined) ?? null;
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
    finalStatus: PaymentStatus | null;
    paymentFound: boolean;
}> {
  const paymentRows = await findPaymentsByProviderRef(tablesDB, providerRef);
  if (paymentRows.length > 1) {
    console.warn(
      `[Payments] Multiple payment rows found for providerRef ${providerRef}. Using the newest row.`
    );
  }

  const existingPayment = paymentRows[0];
  const paymentId = existingPayment?.$id ?? null;
  const currentStatus = normalizePaymentStatus(existingPayment?.status);
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

  const transitionAccepted = existingPayment
    ? canTransitionPaymentStatus(currentStatus, status)
    : false;
  const finalStatus = existingPayment
    ? transitionAccepted
      ? status
      : currentStatus
    : null;

  if (!existingPayment) {
    console.warn(
      `[Payments] Ignoring reconciliation for providerRef ${providerRef} because no local payment row exists.`
    );
  } else if (!transitionAccepted) {
    console.warn(
      `[Payments] Ignoring disallowed payment transition ${currentStatus ?? "unknown"} -> ${status} for providerRef ${providerRef}.`
    );
  } else {
    const paymentData: Record<string, unknown> = {
      currency: resolvedCurrency,
    };

    if (status !== currentStatus) {
      paymentData.status = status;
    }

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

    if (Object.keys(paymentData).length > 0) {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.payments,
        rowId: existingPayment.$id,
        data: paymentData,
      });
    }
  }

  let enrollmentCreated = false;
  let enrollmentUpdated = false;

  if (
    transitionAccepted &&
    resolvedUserId &&
    resolvedCourseId &&
    finalStatus === "completed"
  ) {
    const existingEnrollment = await findEnrollmentByUserAndCourse(
      tablesDB,
      resolvedUserId,
      resolvedCourseId
    );
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
  } else if (
    transitionAccepted &&
    resolvedUserId &&
    resolvedCourseId &&
    (finalStatus === "failed" || finalStatus === "refunded")
  ) {
    const existingEnrollment = await findEnrollmentByUserAndCourse(
      tablesDB,
      resolvedUserId,
      resolvedCourseId
    );

    if (existingEnrollment) {
      const nextPaymentId = paymentId ?? providerRef;
      const shouldUpdate =
        isEnrollmentActive(existingEnrollment) ||
        String(existingEnrollment.paymentId ?? "") !== nextPaymentId ||
        String(existingEnrollment.accessModel ?? "") !== resolvedAccessModel;

      if (shouldUpdate) {
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.enrollments,
          rowId: existingEnrollment.$id,
          data: {
            paymentId: nextPaymentId,
            accessModel: resolvedAccessModel,
            isActive: false,
          },
        });
        enrollmentUpdated = true;
      }
    }
  }

  return {
    paymentId,
    courseId: resolvedCourseId,
    courseSlug,
    enrollmentCreated,
    enrollmentUpdated,
    finalStatus,
    paymentFound: Boolean(existingPayment),
  };
}
