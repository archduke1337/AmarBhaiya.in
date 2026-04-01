import { DollarSign, TrendingUp, BookOpen } from "lucide-react";
import { Query } from "node-appwrite";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader, StatCard, StatGrid, EmptyState } from "@/components/dashboard";
import { formatCurrency } from "@/lib/utils/format";

type AnyRow = Record<string, unknown> & { $id: string };

async function getInstructorEarnings(userId: string) {
  const { tablesDB } = await createAdminClient();

  // Get instructor's courses
  const coursesResult = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.courses,
    queries: [
      Query.equal("instructorId", [userId]),
      Query.limit(100),
    ],
  });

  const courses = coursesResult.rows as AnyRow[];
  const courseIds = courses.map((c) => c.$id);

  if (courseIds.length === 0) {
    return { totalEarnings: 0, monthlyEarnings: 0, courseEarnings: [], totalEnrollments: 0 };
  }

  // Get all payments for these courses
  const allPayments: AnyRow[] = [];
  for (const courseId of courseIds) {
    try {
      const payResult = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.payments,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.equal("status", ["completed"]),
          Query.limit(500),
        ],
      });
      allPayments.push(...(payResult.rows as AnyRow[]));
    } catch {
      // skip
    }
  }

  // Get enrollments
  let totalEnrollments = 0;
  for (const courseId of courseIds) {
    try {
      const enrollResult = await tablesDB.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.enrollments,
        queries: [
          Query.equal("courseId", [courseId]),
          Query.limit(500),
        ],
      });
      totalEnrollments += enrollResult.rows.length;
    } catch {
      // skip
    }
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalEarnings = 0;
  let monthlyEarnings = 0;
  const earningsByCourse = new Map<string, number>();

  for (const p of allPayments) {
    const amount = Number(p.amount ?? 0) / 100; // paise → INR
    totalEarnings += amount;

    const createdAt = new Date(String(p.createdAt ?? ""));
    if (createdAt >= monthStart) {
      monthlyEarnings += amount;
    }

    const cid = String(p.courseId ?? "");
    earningsByCourse.set(cid, (earningsByCourse.get(cid) ?? 0) + amount);
  }

  const courseEarnings = courses.map((c) => ({
    id: c.$id,
    title: String(c.title ?? "Untitled"),
    earnings: earningsByCourse.get(c.$id) ?? 0,
    accessModel: String(c.accessModel ?? "free"),
  }));

  return { totalEarnings, monthlyEarnings, courseEarnings, totalEnrollments };
}

export default async function InstructorEarningsPage() {
  const { user } = await requireRole(["admin", "instructor"]);
  const data = await getInstructorEarnings(user.$id);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        eyebrow="Instructor · Revenue"
        title="Earnings Overview"
        description="Track your course revenue and enrollment metrics."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Total Earnings"
          value={formatCurrency(data.totalEarnings)}
          icon={DollarSign}
          description="All time"
        />
        <StatCard
          label="This Month"
          value={formatCurrency(data.monthlyEarnings)}
          icon={TrendingUp}
          description={`${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`}
        />
        <StatCard
          label="Total Enrollments"
          value={data.totalEnrollments}
          icon={BookOpen}
          description="Across all courses"
        />
      </StatGrid>

      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Revenue by Course</h2>
        </div>
        {data.courseEarnings.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No courses yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.courseEarnings
              .sort((a, b) => b.earnings - a.earnings)
              .map((course) => (
                <div
                  key={course.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{course.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {course.accessModel}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {course.earnings > 0
                      ? formatCurrency(course.earnings)
                      : "Free"}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
