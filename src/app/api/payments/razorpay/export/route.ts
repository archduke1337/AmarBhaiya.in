import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  safeListAllRows,
  listRowsByFieldValues,
  type AnyRow,
} from "@/lib/appwrite/dashboard-data/internal";

export async function GET() {
  await requireRole(["admin"]);

  try {
    const { tablesDB, users } = await createAdminClient();

    const paymentRows = await safeListAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.payments,
      [Query.orderDesc("$createdAt")]
    );

    // Enrich with user and course names
    const userIds = [...new Set(paymentRows.map((p) => String(p.userId ?? "")).filter(Boolean))];
    const courseIds = [...new Set(paymentRows.map((p) => String(p.courseId ?? "")).filter(Boolean))];

    const userMap = new Map<string, string>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const u = await users.get({ userId: uid });
          userMap.set(uid, u.name || uid);
        } catch {
          userMap.set(uid, uid);
        }
      })
    );

    const courseRows = await listRowsByFieldValues<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.courses,
      "$id",
      courseIds
    );
    const courseMap = new Map(courseRows.map((c) => [c.$id, String(c.title ?? c.$id)]));

    // Build CSV
    const headers = [
      "Payment ID",
      "Student Name",
      "Student ID",
      "Course Title",
      "Course ID",
      "Amount (INR)",
      "Status",
      "Method",
      "Provider Reference",
      "Created At",
    ];

    const rows = paymentRows.map((p) => [
      p.$id,
      userMap.get(String(p.userId ?? "")) || "Unknown",
      String(p.userId ?? ""),
      courseMap.get(String(p.courseId ?? "")) || "Unknown Course",
      String(p.courseId ?? ""),
      (Number(p.amount ?? 0) / 100).toFixed(2),
      String(p.status ?? "pending"),
      String(p.method ?? "razorpay"),
      String(p.providerRef ?? ""),
      String(p.createdAt ?? ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape commas and quotes
            const str = String(cell);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payments-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export payments" },
      { status: 500 }
    );
  }
}
