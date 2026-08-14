"use server";

import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { requireAuth, requireRole } from "@/server/appwrite/auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

// ── Schemas ─────────────────────────────────────────────────────────────────

const createCouponSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required.").max(50).transform((v) => v.toUpperCase()),
  courseId: z.string().optional(),
  resourceId: z.string().optional(),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().positive("Value must be positive.").max(1000000),
  maxUses: z.coerce.number().int().min(1).default(100),
  expiresAt: z.string().optional(),
}).refine((data) => data.courseId || data.resourceId, {
  message: "Either course or resource must be specified.",
});

// ── Helper ──────────────────────────────────────────────────────────────────

async function getUserInstructorCourses(userId: string) {
  const { tablesDB } = await createAdminClient();
  const courses = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.courses,
    queries: [Query.equal("instructorId", [userId]), Query.limit(1000)],
  });
  return new Set(courses.rows.map((c) => c.$id));
}

// ── Create Coupon ───────────────────────────────────────────────────────────

export async function createCouponAction(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const role = (user.labels ?? []).includes("admin") ? "admin" : "instructor";

  const parsed = createCouponSchema.safeParse({
    code: formData.get("code"),
    courseId: formData.get("courseId") || undefined,
    resourceId: formData.get("resourceId") || undefined,
    type: formData.get("type"),
    value: formData.get("value"),
    maxUses: formData.get("maxUses") || "100",
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid coupon data.");
  }

  try {
    const { tablesDB } = await createAdminClient();

    // If instructor, verify ownership
    if (role === "instructor") {
      if (parsed.data.courseId) {
        const courseIds = await getUserInstructorCourses(user.$id);
        if (!courseIds.has(parsed.data.courseId)) {
          return actionError("You can only create coupons for your own courses.");
        }
      }
      if (parsed.data.resourceId) {
        const resource = await tablesDB.getRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.standaloneResources,
          rowId: parsed.data.resourceId,
        }).catch(() => null) as Record<string, unknown> | null;
        if (!resource || String(resource.instructorId ?? "") !== user.$id) {
          return actionError("You can only create coupons for your own resources.");
        }
      }
    }

    // Check if code already exists
    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      queries: [Query.equal("code", [parsed.data.code]), Query.limit(1)],
    });

    if (existing.rows.length > 0) {
      return actionError(`Coupon code "${parsed.data.code}" already exists.`);
    }

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      rowId: ID.unique(),
      data: {
        code: parsed.data.code,
        courseId: parsed.data.courseId || "",
        resourceId: parsed.data.resourceId || "",
        instructorId: user.$id,
        type: parsed.data.type,
        value: parsed.data.type === "percent" ? Math.min(parsed.data.value, 100) : parsed.data.value,
        maxUses: parsed.data.maxUses,
        usedCount: 0,
        expiresAt: parsed.data.expiresAt || null,
        isActive: true,
        createdBy: user.$id,
        createdAt: new Date().toISOString(),
      },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/instructor/coupons");
    return actionSuccess();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Failed to create coupon.");
  }
}

// ── Toggle Coupon Active ────────────────────────────────────────────────────

export async function toggleCouponAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "instructor"]);

  const couponId = String(formData.get("couponId") ?? "").trim();
  const isActive = formData.get("isActive") === "true";

  if (!couponId) {
    return actionError("Coupon ID is required.");
  }

  try {
    const { tablesDB } = await createAdminClient();
    const user = await requireAuth();
    const role = (user.labels ?? []).includes("admin") ? "admin" : "instructor";

    const coupon = await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      rowId: couponId,
    }).catch(() => null) as Record<string, unknown> | null;

    if (!coupon) {
      return actionError("Coupon not found.");
    }

    // If instructor, verify ownership
    if (role === "instructor" && String(coupon.instructorId ?? "") !== user.$id) {
      return actionError("You can only modify your own coupons.");
    }

    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      rowId: couponId,
      data: { isActive },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/instructor/coupons");
    return actionSuccess();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Failed to toggle coupon.");
  }
}

// ── Delete Coupon ───────────────────────────────────────────────────────────

export async function deleteCouponAction(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "instructor"]);

  const couponId = String(formData.get("couponId") ?? "").trim();
  if (!couponId) {
    return actionError("Coupon ID is required.");
  }

  try {
    const { tablesDB } = await createAdminClient();
    const user = await requireAuth();
    const role = (user.labels ?? []).includes("admin") ? "admin" : "instructor";

    const coupon = await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      rowId: couponId,
    }).catch(() => null) as Record<string, unknown> | null;

    if (!coupon) {
      return actionError("Coupon not found.");
    }

    if (role === "instructor" && String(coupon.instructorId ?? "") !== user.$id) {
      return actionError("You can only delete your own coupons.");
    }

    await tablesDB.deleteRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      rowId: couponId,
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/instructor/coupons");
    return actionSuccess();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Failed to delete coupon.");
  }
}

// ── Apply Coupon (for checkout) ─────────────────────────────────────────────

export type CouponResult = {
  valid: boolean;
  message: string;
  discountAmount?: number;
  finalAmount?: number;
  couponCode?: string;
};

export async function validateCouponAction(
  code: string,
  courseId: string,
  resourceId?: string
): Promise<CouponResult> {
  if (!code || (!courseId && !resourceId)) {
    return { valid: false, message: "Coupon code and target (course or resource) are required." };
  }

  try {
    const { tablesDB } = await createAdminClient();

    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      queries: [Query.equal("code", [code.toUpperCase()]), Query.limit(1)],
    });

    const coupon = result.rows[0] as Record<string, unknown> | undefined;
    if (!coupon) {
      return { valid: false, message: "Invalid coupon code." };
    }

    // Check if active
    if (coupon.isActive === false || coupon.isActive === "false" || coupon.isActive === 0) {
      return { valid: false, message: "This coupon is no longer active." };
    }

    // Check if expired
    if (coupon.expiresAt) {
      const expiresAt = new Date(String(coupon.expiresAt));
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
        return { valid: false, message: "This coupon has expired." };
      }
    }

    // Check if course/resource matches
    const couponCourseId = String(coupon.courseId ?? "");
    const couponResourceId = String((coupon as Record<string, unknown>).resourceId ?? "");
    if (resourceId) {
      if (couponResourceId !== resourceId) {
        return { valid: false, message: "This coupon does not apply to this resource." };
      }
    } else if (courseId) {
      if (couponCourseId !== courseId) {
        return { valid: false, message: "This coupon does not apply to this course." };
      }
    }

    // Check usage limit
    const usedCount = Number(coupon.usedCount ?? 0);
    const maxUses = Number(coupon.maxUses ?? 1);
    if (usedCount >= maxUses) {
      return { valid: false, message: "This coupon has reached its usage limit." };
    }

    // Get price (course or resource)
    let price = 0;
    if (resourceId) {
      const resource = await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.standaloneResources,
        rowId: resourceId,
      }).catch(() => null) as Record<string, unknown> | null;
      if (!resource) {
        return { valid: false, message: "Resource not found." };
      }
      price = Number(resource.price ?? 0);
    } else {
      const course = await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseId,
      }).catch(() => null) as Record<string, unknown> | null;
      if (!course) {
        return { valid: false, message: "Course not found." };
      }
      price = Number(course.price ?? 0);
    }
    const couponType = String(coupon.type ?? "percent");
    const couponValue = Number(coupon.value ?? 0);

    let discountAmount = 0;
    if (couponType === "percent") {
      discountAmount = Math.round((price * Math.min(couponValue, 100)) / 100);
    } else {
      discountAmount = Math.min(couponValue, price);
    }

    const finalAmount = price - discountAmount;

    return {
      valid: true,
      message: couponType === "percent"
        ? `${couponValue}% off — save ₹${discountAmount}`
        : `₹${couponValue} off`,
      discountAmount,
      finalAmount: Math.max(finalAmount, 0),
      couponCode: String(coupon.code ?? ""),
    };
  } catch {
    return { valid: false, message: "Failed to validate coupon." };
  }
}

// ── Increment coupon usage (called after successful payment) ────────────────

export async function incrementCouponUsageAction(couponCode: string): Promise<void> {
  try {
    const { tablesDB } = await createAdminClient();
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      queries: [Query.equal("code", [couponCode.toUpperCase()]), Query.limit(1)],
    });

    const coupon = result.rows[0];
    if (coupon) {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.coupons,
        rowId: coupon.$id,
        data: {
          usedCount: Number(coupon.usedCount ?? 0) + 1,
        },
      });
    }
  } catch {
    // Non-critical
  }
}

// ── Get Coupons (for dashboard) ─────────────────────────────────────────────

export type CouponItem = {
  id: string;
  code: string;
  courseId: string;
  courseTitle: string;
  resourceId: string;
  resourceTitle: string;
  type: string;
  value: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string;
  instructorId: string;
  createdAt: string;
};

// ── Coupon Analytics ───────────────────────────────────────────────────────

export type CouponAnalytics = {
  totalCoupons: number;
  activeCoupons: number;
  totalUsageCount: number;
  totalDiscountGiven: number;
  topCoupons: Array<{
    code: string;
    courseTitle: string;
    usedCount: number;
    type: string;
    value: number;
  }>;
  usageByCourse: Array<{
    courseTitle: string;
    couponCount: number;
    totalUsed: number;
  }>;
};

export async function getCouponAnalytics(): Promise<CouponAnalytics> {
  await requireRole(["admin", "instructor"]);

  try {
    const { tablesDB } = await createAdminClient();

    // Get all coupons with course enrichment
    const coupons = await getCoupons();

    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter((c) => c.isActive).length;
    const totalUsageCount = coupons.reduce((sum, c) => sum + c.usedCount, 0);

    // Calculate total discount given by looking at payments with couponCode
    let totalDiscountGiven = 0;
    try {
      const allCompleted = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.payments,
        queries: [Query.equal("status", ["completed"])],
      });

      for (const row of allCompleted.rows) {
        const r = row as Record<string, unknown>;
        if (!r.couponCode) continue;
        const originalAmount = Number(r.originalAmount ?? 0);
        const amount = Number(r.amount ?? 0);
        if (originalAmount > 0 && amount < originalAmount) {
          totalDiscountGiven += (originalAmount - amount) / 100;
        }
      }
    } catch {
      // Non-critical
    }

    // Top coupons by usage
    const topCoupons = coupons
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5)
      .map((c) => ({
        code: c.code,
        courseTitle: c.courseTitle,
        usedCount: c.usedCount,
        type: c.type,
        value: c.value,
      }));

    // Usage by course
    const courseMap = new Map<string, { courseTitle: string; couponCount: number; totalUsed: number }>();
    for (const coupon of coupons) {
      const key = coupon.courseId || coupon.courseTitle;
      const existing = courseMap.get(key) ?? {
        courseTitle: coupon.courseTitle,
        couponCount: 0,
        totalUsed: 0,
      };
      existing.couponCount += 1;
      existing.totalUsed += coupon.usedCount;
      courseMap.set(key, existing);
    }

    const usageByCourse = Array.from(courseMap.values())
      .sort((a, b) => b.totalUsed - a.totalUsed)
      .slice(0, 5);

    return {
      totalCoupons,
      activeCoupons,
      totalUsageCount,
      totalDiscountGiven,
      topCoupons,
      usageByCourse,
    };
  } catch {
    return {
      totalCoupons: 0,
      activeCoupons: 0,
      totalUsageCount: 0,
      totalDiscountGiven: 0,
      topCoupons: [],
      usageByCourse: [],
    };
  }
}

// ── Coupon Payment Stats (for instructor revenue) ────────────────────────────

export type CouponPaymentStat = {
  courseId: string;
  couponCode: string;
  count: number;
  totalDiscount: number;
};

export async function getCouponPaymentStats(courseIds: string[]): Promise<CouponPaymentStat[]> {
  if (courseIds.length === 0) return [];

  try {
    const { tablesDB } = await createAdminClient();
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [Query.equal("status", ["completed"]), Query.limit(5000)],
    });

    const courseIdSet = new Set(courseIds);
    const stats = new Map<string, CouponPaymentStat>();

    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      const courseId = String(r.courseId ?? "");
      const couponCode = String(r.couponCode ?? "");

      if (!courseIdSet.has(courseId) || !couponCode) continue;

      const key = `${courseId}:${couponCode}`;
      const existing = stats.get(key) ?? {
        courseId,
        couponCode,
        count: 0,
        totalDiscount: 0,
      };

      existing.count += 1;

      const originalAmount = Number(r.originalAmount ?? r.amount ?? 0);
      const amount = Number(r.amount ?? 0);
      if (originalAmount > amount) {
        existing.totalDiscount += (originalAmount - amount) / 100;
      }

      stats.set(key, existing);
    }

    return Array.from(stats.values()).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

// ── Get Coupons (for dashboard) ─────────────────────────────────────────────

export async function getCoupons(): Promise<CouponItem[]> {
  const user = await requireAuth();
  const role = (user.labels ?? []).includes("admin") ? "admin" : "instructor";

  try {
    const { tablesDB } = await createAdminClient();

    const queries: string[] = [Query.orderDesc("$createdAt")];
    if (role === "instructor") {
      queries.push(Query.equal("instructorId", [user.$id]));
    }

    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      queries,
    });

    const rows = result.rows as Array<Record<string, unknown>>;

    // Enrich with course and resource titles
    const courseIds = [...new Set(rows.map((r) => String(r.courseId ?? "")).filter(Boolean))];
    const resourceIds = [...new Set(rows.map((r) => String((r as Record<string, unknown>).resourceId ?? "")).filter(Boolean))];
    const courseMap = new Map<string, string>();
    const resourceMap = new Map<string, string>();

    if (courseIds.length > 0) {
      const courses = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        queries: [Query.equal("$id", courseIds), Query.limit(100)],
      });
      for (const c of courses.rows) {
        courseMap.set(c.$id, String(c.title ?? c.$id));
      }
    }
    if (resourceIds.length > 0) {
      const resources = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.standaloneResources,
        queries: [Query.equal("$id", resourceIds), Query.limit(100)],
      });
      for (const r of resources.rows) {
        resourceMap.set(r.$id, String(r.title ?? r.$id));
      }
    }

    return rows.map((r) => ({
      id: String(r.$id ?? ""),
      code: String(r.code ?? ""),
      courseId: String(r.courseId ?? ""),
      courseTitle: courseMap.get(String(r.courseId ?? "")) || "",
      resourceId: String((r as Record<string, unknown>).resourceId ?? ""),
      resourceTitle: resourceMap.get(String((r as Record<string, unknown>).resourceId ?? "")) || "",
      type: String(r.type ?? "percent"),
      value: Number(r.value ?? 0),
      maxUses: Number(r.maxUses ?? 100),
      usedCount: Number(r.usedCount ?? 0),
      expiresAt: r.expiresAt ? String(r.expiresAt) : null,
      isActive: Boolean(r.isActive === true || r.isActive === "true" || r.isActive === 1),
      createdBy: String(r.createdBy ?? ""),
      instructorId: String(r.instructorId ?? ""),
      createdAt: String(r.createdAt ?? ""),
    }));
  } catch {
    return [];
  }
}
