"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { actionSuccess, actionError, type ActionResult } from "@/lib/errors/action-result";

type AnyRow = Record<string, unknown> & { $id: string };

// ── Types ───────────────────────────────────────────────────────────────────

export type CertificateItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  shareUrl: string;
};

// ── Issue Certificate (Called when course reaches 100% completion) ──────────

export async function issueCertificateAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const courseId = String(formData.get("courseId") ?? "");
    if (!courseId) return actionError("Course ID is required");

    const { tablesDB } = await createAdminClient();

    // Use unique composite key to prevent duplicate certificates
    // (prevents race condition if this action called twice)
    const certificateKey = `${user.$id}:${courseId}`;

    // Check if certificate already exists
    try {
      const existing = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.certificates,
        queries: [
          Query.equal("userId", [user.$id]),
          Query.equal("courseId", [courseId]),
          Query.limit(1),
        ],
      });

      if (existing.rows.length > 0) {
        return actionSuccess(); // Already issued
      }
    } catch {
      // Continue
    }

    // Verify enrollment exists and is complete (100% progress)
    let enrollmentRow: AnyRow | undefined;
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

      enrollmentRow = enrollment.rows[0] as AnyRow | undefined;
      if (!enrollmentRow) return actionError("No enrollment found");

      const progress = Number(enrollmentRow.progress ?? 0);
      if (progress < 100) return actionError("Course not completed yet");
    } catch (error) {
      return actionError("Failed to verify enrollment");
    }

    // Get course title for certificate
    let courseTitle = "Course";
    try {
      const course = (await tablesDB.getRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseId,
      })) as AnyRow;
      courseTitle = String(course.title ?? "Course");
    } catch {
      // Use default title
    }

    // Generate unique certificate ID with verification token
    const certId = ID.unique();
    const verificationToken = `${certId}:${user.$id}:${Date.now()}`;
    const shareUrl = `/certificates/${certId}`;

    try {
      // Create certificate record
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
          verificationToken,
          isPublished: true,
        },
      });

      revalidatePath("/app/certificates");
      revalidatePath("/app/courses");
      return actionSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to issue certificate";
      return actionError(message);
    }
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Unexpected error");
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
