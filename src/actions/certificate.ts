"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

type AnyRow = Record<string, unknown> & { $id: string };

// ── Types ───────────────────────────────────────────────────────────────────

export type CertificateItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  shareUrl: string;
};

// ── Issue Certificate ───────────────────────────────────────────────────────

export async function issueCertificateAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return;

  const { tablesDB } = await createAdminClient();

  // Check if certificate already exists
  try {
    const existing = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.certificates,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [user.$id]),
        Query.limit(1),
      ],
    });

    if (existing.rows.length > 0) return; // Already issued
  } catch {
    // Continue
  }

  // Verify enrollment is complete (100% progress)
  try {
    const enrollment = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [
        Query.equal("courseId", [courseId]),
        Query.equal("userId", [user.$id]),
        Query.limit(1),
      ],
    });

    const enrollmentRow = enrollment.rows[0] as AnyRow | undefined;
    if (!enrollmentRow) return;

    const progress = Number(enrollmentRow.progress ?? 0);
    if (progress < 100) return; // Not yet completed
  } catch {
    return;
  }

  // Get course title
  let courseTitle = "Course";
  try {
    const course = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.courses,
      rowId: courseId,
    })) as AnyRow;
    courseTitle = String(course.title ?? "Course");
  } catch {
    // Use default
  }

  // Generate a unique share URL
  const certId = ID.unique();
  const shareUrl = `/certificates/${certId}`;

  try {
    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.certificates,
      rowId: certId,
      data: {
        userId: user.$id,
        courseId,
        courseTitle,
        userName: user.name,
        issuedAt: new Date().toISOString(),
        fileId: "", // PDF generation can be added later
        shareUrl,
      },
    });

    revalidatePath("/app/courses");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Failed to issue certificate."
    );
  }
}

// ── Get User Certificates ───────────────────────────────────────────────────

export async function getUserCertificates(
  userId: string
): Promise<CertificateItem[]> {
  const { tablesDB } = await createAdminClient();

  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.certificates,
      queries: [
        Query.equal("userId", [userId]),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ],
    });

    return result.rows.map((r) => {
      const row = r as AnyRow;
      return {
        id: row.$id,
        courseId: String(row.courseId ?? ""),
        courseTitle: String(row.courseTitle ?? "Course"),
        issuedAt: String(row.issuedAt ?? ""),
        shareUrl: String(row.shareUrl ?? ""),
      };
    });
  } catch {
    return [];
  }
}

// ── Get Certificate by ID (public) ──────────────────────────────────────────

export async function getCertificateById(certId: string): Promise<{
  userName: string;
  courseTitle: string;
  issuedAt: string;
} | null> {
  const { tablesDB } = await createAdminClient();

  try {
    const cert = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.certificates,
      rowId: certId,
    })) as AnyRow;

    return {
      userName: String(cert.userName ?? "Student"),
      courseTitle: String(cert.courseTitle ?? "Course"),
      issuedAt: String(cert.issuedAt ?? ""),
    };
  } catch {
    return null;
  }
}
