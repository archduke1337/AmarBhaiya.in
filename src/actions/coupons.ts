"use server";

import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { requireAuth, requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

// ── Schemas ─────────────────────────────────────────────────────────────────

const createCouponSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required.").max(50).transform((v) => v.toUpperCase()),
  courseId: z.string().min(1),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().positive("Value must be positive.").max(1000000),
  maxUses: z.coerce.number().int().min(1).default(100),
  expiresAt: z.string().optional(),
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
    courseId: formData.get("courseId"),
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

    // If instructor, verify they own the course
    if (role === "instructor") {
      const courseIds = await getUserInstructorCourses(user.$id);
      if (!courseIds.has(parsed.data.courseId)) {
        return actionError("You can only create coupons for your own courses.");
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
        courseId: parsed.data.courseId,
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
  courseId: string
): Promise<CouponResult> {
  if (!code || !courseId) {
    return { valid: false, message: "Coupon code and course are required." };
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

    // Check if course matches
    if (String(coupon.courseId ?? "") !== courseId) {
      return { valid: false, message: "This coupon does not apply to this course." };
    }

    // Check usage limit
    const usedCount = Number(coupon.usedCount ?? 0);
    const maxUses = Number(coupon.maxUses ?? 1);
    if (usedCount >= maxUses) {
      return { valid: false, message: "This coupon has reached its usage limit." };
    }

    // Get course price
    const course = await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
    }).catch(() => null) as Record<string, unknown> | null;

    if (!course) {
      return { valid: false, message: "Course not found." };
    }

    const price = Number(course.price ?? 0);
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
  } catch (error) {
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

    // Enrich with course titles
    const courseIds = [...new Set(rows.map((r) => String(r.courseId ?? "")).filter(Boolean))];
    const courseMap = new Map<string, string>();

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

    return rows.map((r) => ({
      id: String(r.$id ?? ""),
      code: String(r.code ?? ""),
      courseId: String(r.courseId ?? ""),
      courseTitle: courseMap.get(String(r.courseId ?? "")) || "Unknown Course",
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
