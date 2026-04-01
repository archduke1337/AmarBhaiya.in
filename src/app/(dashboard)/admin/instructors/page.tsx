import Link from "next/link";
import { Users, BookOpen, DollarSign } from "lucide-react";
import { Query } from "node-appwrite";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { formatCurrency } from "@/lib/utils/format";

type AnyRow = Record<string, unknown> & { $id: string };

type InstructorInfo = {
  userId: string;
  name: string;
  email: string;
  courseCount: number;
  totalEnrollments: number;
  totalRevenue: number;
};

async function getInstructorActivity(): Promise<InstructorInfo[]> {
  const { tablesDB, users: usersClient } = await createAdminClient();

  // Get all courses grouped by instructor
  const coursesResult = await tablesDB.listRows({
    databaseId: APPWRITE_CONFIG.databaseId,
    tableId: APPWRITE_CONFIG.tables.courses,
    queries: [Query.limit(500)],
  });

  const courses = coursesResult.rows as AnyRow[];

  // Group by instructorId
  const instructorCourses = new Map<string, AnyRow[]>();
  for (const course of courses) {
    const instId = String(course.instructorId ?? "");
    if (!instId) continue;
    const existing = instructorCourses.get(instId) ?? [];
    existing.push(course);
    instructorCourses.set(instId, existing);
  }

  // Get enrollments count per course
  const enrollmentsByCourse = new Map<string, number>();
  try {
    const enrollResult = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [Query.limit(1000)],
    });
    for (const r of enrollResult.rows) {
      const row = r as AnyRow;
      const cid = String(row.courseId ?? "");
      enrollmentsByCourse.set(cid, (enrollmentsByCourse.get(cid) ?? 0) + 1);
    }
  } catch {
    // skip
  }

  // Get completed payments by course
  const revenueByCourse = new Map<string, number>();
  try {
    const paymentsResult = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [
        Query.equal("status", ["completed"]),
        Query.limit(1000),
      ],
    });
    for (const r of paymentsResult.rows) {
      const row = r as AnyRow;
      const cid = String(row.courseId ?? "");
      const amount = Number(row.amount ?? 0) / 100;
      revenueByCourse.set(cid, (revenueByCourse.get(cid) ?? 0) + amount);
    }
  } catch {
    // skip
  }

  const instructors: InstructorInfo[] = [];

  for (const [instId, instCourses] of instructorCourses) {
    let name = instId;
    let email = "";
    try {
      const u = await usersClient.get(instId);
      name = u.name || u.email;
      email = u.email;
    } catch {
      // skip
    }

    let totalEnrollments = 0;
    let totalRevenue = 0;
    for (const c of instCourses) {
      totalEnrollments += enrollmentsByCourse.get(c.$id) ?? 0;
      totalRevenue += revenueByCourse.get(c.$id) ?? 0;
    }

    instructors.push({
      userId: instId,
      name,
      email,
      courseCount: instCourses.length,
      totalEnrollments,
      totalRevenue,
    });
  }

  return instructors.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export default async function AdminInstructorsPage() {
  await requireRole(["admin"]);
  const instructors = await getInstructorActivity();

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        eyebrow="Admin · Instructors"
        title="Instructor Activity"
        description={`${instructors.length} instructors with courses on the platform.`}
      />

      {instructors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No instructors yet"
          description="Instructors will appear here once they create courses."
        />
      ) : (
        <section className="border border-border">
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_80px_100px_100px]">
            <span>Instructor</span>
            <span>Courses</span>
            <span>Students</span>
            <span>Revenue</span>
          </div>
          <div className="divide-y divide-border">
            {instructors.map((inst) => (
              <div
                key={inst.userId}
                className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-[1fr_80px_100px_100px] md:items-center md:gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{inst.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {inst.email}
                  </span>
                </div>
                <span className="text-sm tabular-nums">{inst.courseCount}</span>
                <span className="text-sm tabular-nums">
                  {inst.totalEnrollments}
                </span>
                <span className="text-sm tabular-nums font-medium">
                  {inst.totalRevenue > 0
                    ? formatCurrency(inst.totalRevenue)
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
