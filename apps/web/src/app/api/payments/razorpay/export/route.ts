import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { createAdminClient } from "@/server/appwrite/server";
import { getApiUserContext } from "@/server/appwrite/api-auth";
import { checkRateLimit, getRateLimitKey } from "@/server/rate-limiter";
import {
  safeListAllRows,
  listRowsByFieldValues,
  type AnyRow,
} from "@/server/appwrite/dashboard-data/internal";

export const runtime = "nodejs";

function escapeCsvCell(cell: unknown): string {
  let str = String(cell ?? "");
  // Prevent CSV formula injection (=, +, -, @, tab, carriage return)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const auth = await getApiUserContext();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rlKey = `${getRateLimitKey(request)}:export:${auth.userId}`;
  const rl = await checkRateLimit(rlKey, 5);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } });
  }

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
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map(escapeCsvCell).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payments-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("[Payments Export] failed", error);
    return NextResponse.json(
      { error: "Failed to export payments" },
      { status: 500 }
    );
  }
}
