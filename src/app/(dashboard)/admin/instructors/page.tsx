import { Users } from "lucide-react";
import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { formatCurrency } from "@/lib/utils/format";

type AnyRow = Models.Row & Record<string, unknown>;

type InstructorInfo = {
  userId: string;
  name: string;
  email: string;
  courseCount: number;
  totalEnrollments: number;
  totalRevenue: number;
};

function isActiveEnrollment(row: AnyRow): boolean {
  return row.isActive !== false
    && String(row.status ?? "active") !== "cancelled";
}

async function listAllRows<Row extends AnyRow>(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  tableId: string,
  queries: string[] = [],
  pageSize = 500
): Promise<Row[]> {
  const rows: Row[] = [];
  let offset = 0;

  while (true) {
    const response = await tablesDB
      .listRows<Row>({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId,
        queries: [...queries, Query.limit(pageSize), Query.offset(offset)],
      })
      .catch(() => ({ rows: [] as Row[] }));

    rows.push(...response.rows);

    if (response.rows.length < pageSize) {
      break;
    }

    offset += response.rows.length;
  }

  return rows;
}

function chunkValues(values: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

async function listRowsByFieldValues<Row extends AnyRow>(
  tablesDB: Awaited<ReturnType<typeof createAdminClient>>["tablesDB"],
  tableId: string,
  field: string,
  values: string[],
  extraQueries: string[] = []
): Promise<Row[]> {
  if (values.length === 0) {
    return [];
  }

  const results = await Promise.all(
    chunkValues(values, 20).map((chunk) =>
      listAllRows<Row>(tablesDB, tableId, [Query.equal(field, chunk), ...extraQueries])
    )
  );

  return results.flatMap((result) => result);
}

async function getInstructorActivity(): Promise<InstructorInfo[]> {
  const { tablesDB, users: usersClient } = await createAdminClient();

  const courses = await listAllRows<AnyRow>(tablesDB, APPWRITE_CONFIG.tables.courses);

  const instructorCourses = new Map<string, AnyRow[]>();
  for (const course of courses) {
    const instId = String(course.instructorId ?? "");
    if (!instId) continue;
    const existing = instructorCourses.get(instId) ?? [];
    existing.push(course);
    instructorCourses.set(instId, existing);
  }

  const courseIds = courses.map((course) => course.$id);
  const enrollmentsByCourse = new Map<string, number>();
  const revenueByCourse = new Map<string, number>();

  const [enrollmentRows, paymentRows] = await Promise.all([
    listRowsByFieldValues<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.enrollments,
      "courseId",
      courseIds
    ),
    listRowsByFieldValues<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.payments,
      "courseId",
      courseIds,
      [Query.equal("status", ["completed"])]
    ),
  ]);

  for (const row of enrollmentRows) {
    if (!isActiveEnrollment(row)) {
      continue;
    }

    const cid = String(row.courseId ?? "");
    if (!cid) {
      continue;
    }

    enrollmentsByCourse.set(cid, (enrollmentsByCourse.get(cid) ?? 0) + 1);
  }

  for (const row of paymentRows) {
    const cid = String(row.courseId ?? "");
    if (!cid) {
      continue;
    }

    const amount = Number(row.amount ?? 0) / 100;
    revenueByCourse.set(cid, (revenueByCourse.get(cid) ?? 0) + amount);
  }

  const instructors = await Promise.all(
    [...instructorCourses.entries()].map(async ([instId, instCourses]) => {
      let name = instId;
      let email = "";
      try {
        const user = await usersClient.get(instId);
        name = user.name || user.email;
        email = user.email;
      } catch {
        // Keep the fallback identity when the user lookup fails.
      }

      let totalEnrollments = 0;
      let totalRevenue = 0;
      for (const course of instCourses) {
        totalEnrollments += enrollmentsByCourse.get(course.$id) ?? 0;
        totalRevenue += revenueByCourse.get(course.$id) ?? 0;
      }

      return {
        userId: instId,
        name,
        email,
        courseCount: instCourses.length,
        totalEnrollments,
        totalRevenue,
      };
    })
  );

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
