import Link from "next/link";
import { notFound } from "next/navigation";
import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

import { adminUnenrollAction } from "@/actions/enrollment";
import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

type AnyRow = Models.Row & Record<string, unknown>;
type TablesDbClient = Awaited<ReturnType<typeof createAdminClient>>["tablesDB"];

type PageProps = {
  params: Promise<{ userId: string }>;
};

type CourseMeta = {
  title: string;
  slug: string;
};

type EnrollmentInfo = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  enrolledAt: string;
  progress: number;
  status: string;
};

type PaymentInfo = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  providerRef: string;
  createdAt: string;
};

async function listAllRows<Row extends AnyRow>(
  tablesDB: TablesDbClient,
  tableId: string,
  queries: string[] = [],
  pageSize = 500
): Promise<Row[]> {
  const rows: Row[] = [];
  let offset = 0;

  while (true) {
    const result = await tablesDB
      .listRows<Row>({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId,
        queries: [...queries, Query.limit(pageSize), Query.offset(offset)],
      })
      .catch(() => ({ rows: [] as Row[] }));

    rows.push(...result.rows);

    if (result.rows.length < pageSize) {
      break;
    }

    offset += result.rows.length;
  }

  return rows;
}

async function loadCourseMetaByIds(
  tablesDB: TablesDbClient,
  courseIds: string[]
): Promise<Map<string, CourseMeta>> {
  const metaById = new Map<string, CourseMeta>();
  if (courseIds.length === 0) {
    return metaById;
  }

  const chunks: string[][] = [];
  for (let index = 0; index < courseIds.length; index += 20) {
    chunks.push(courseIds.slice(index, index + 20));
  }

  const courseResults = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const result = await tablesDB.listRows({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          queries: [Query.equal("$id", chunk), Query.limit(100)],
        });

        return result.rows as AnyRow[];
      } catch {
        return [] as AnyRow[];
      }
    })
  );

  for (const row of courseResults.flat()) {
    metaById.set(row.$id, {
      title: String(row.title ?? "Unknown Course"),
      slug: String(row.slug ?? row.$id),
    });
  }

  return metaById;
}

async function getStudentDetail(userId: string) {
  const { tablesDB, users } = await createAdminClient();

  let userName = "";
  let userEmail = "";
  let userFound = false;
  try {
    const user = await users.get(userId);
    userName = user.name || user.email || "Unknown";
    userEmail = user.email;
    userFound = true;
  } catch {
    // user may not exist
  }

  let profile: AnyRow | null = null;
  try {
    const profileResult = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.studentProfiles,
      queries: [Query.equal("userId", [userId]), Query.limit(1)],
    });
    profile = (profileResult.rows[0] as AnyRow) ?? null;
  } catch {
    // skip
  }

  const enrollments: EnrollmentInfo[] = [];
  try {
    const enrollmentRows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.enrollments,
      [Query.equal("userId", [userId]), Query.orderDesc("enrolledAt")]
    );
    const courseIds = Array.from(
      new Set(
        enrollmentRows
          .map((row) => String(row.courseId ?? ""))
          .filter((courseId) => courseId.length > 0)
      )
    );

    const courseMetaById = await loadCourseMetaByIds(tablesDB, courseIds);

    for (const row of enrollmentRows) {
      const courseId = String(row.courseId ?? "");
      const courseMeta = courseMetaById.get(courseId);
      enrollments.push({
        id: row.$id,
        courseId,
        courseTitle: courseMeta?.title ?? "Unknown Course",
        courseSlug: courseMeta?.slug ?? courseId,
        enrolledAt: String(row.enrolledAt ?? ""),
        progress: Number(row.progress ?? 0),
        status: String(row.status ?? "active"),
      });
    }
  } catch {
    // skip
  }

  const payments: PaymentInfo[] = [];
  try {
    const paymentRows = await listAllRows<AnyRow>(
      tablesDB,
      APPWRITE_CONFIG.tables.payments,
      [Query.equal("userId", [userId]), Query.orderDesc("createdAt")]
    );
    const paymentCourseIds = Array.from(
      new Set(
        paymentRows
          .map((row) => String(row.courseId ?? ""))
          .filter((courseId) => courseId.length > 0)
      )
    );

    const courseMetaById = await loadCourseMetaByIds(tablesDB, paymentCourseIds);

    for (const row of paymentRows) {
      const courseId = String(row.courseId ?? "");
      const courseMeta = courseMetaById.get(courseId);
      payments.push({
        id: row.$id,
        courseId,
        courseTitle: courseMeta?.title ?? "Unknown Course",
        courseSlug: courseMeta?.slug ?? courseId,
        amount: Number(row.amount ?? 0) / 100,
        currency: String(row.currency ?? "INR"),
        method: String(row.method ?? ""),
        status: String(row.status ?? ""),
        providerRef: String(row.providerRef ?? row.$id),
        createdAt: String(row.createdAt ?? ""),
      });
    }
  } catch {
    // skip
  }

  return {
    userName: userName || "Unknown",
    userEmail,
    userFound,
    profile,
    enrollments,
    payments,
  };
}

export default async function AdminStudentDetailPage({ params }: PageProps) {
  await requireRole(["admin"]);
  const { userId } = await params;
  const data = await getStudentDetail(userId);

  if (!data.userFound) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        eyebrow="Admin · Student Detail"
        title={data.userName}
        description={`${data.userEmail} · ${data.enrollments.length} enrollments · ${data.payments.length} payments`}
      />

      {data.profile && (
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Profile</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
            {["grade", "school", "city", "dateOfBirth", "guardianName", "phone"].map(
              (field) => {
                const value = String((data.profile as AnyRow)[field] ?? "—");
                return (
                  <div key={field}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                      {field}
                    </p>
                    <p className="text-sm">{value}</p>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">
            Enrollments ({data.enrollments.length})
          </h2>
        </div>
        {data.enrollments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            No enrollments.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="px-5 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  {enrollment.courseSlug ? (
                    <Link
                      href={`/courses/${enrollment.courseSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {enrollment.courseTitle}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{enrollment.courseTitle}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Enrolled: {enrollment.enrolledAt ? formatDateTime(enrollment.enrolledAt) : "—"} · Progress: {enrollment.progress}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={enrollment.status === "active" ? "default" : "outline"}
                    className="uppercase"
                  >
                    {enrollment.status}
                  </Badge>
                  <form action={adminUnenrollAction}>
                    <input type="hidden" name="enrollmentId" value={enrollment.id} />
                    <button
                      type="submit"
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">
            Payments ({data.payments.length})
          </h2>
        </div>
        {data.payments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            No payment records.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.payments.map((payment) => (
              <div
                key={payment.id}
                className="px-5 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {payment.courseSlug ? (
                      <Link
                        href={`/courses/${payment.courseSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {payment.courseTitle}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{payment.courseTitle}</p>
                    )}
                    <Link
                      href={`/admin/payments#payment-${payment.id}`}
                      className="text-[10px] text-muted-foreground underline underline-offset-4"
                    >
                      Open payment
                    </Link>
                  </div>
                  <p className="text-sm tabular-nums">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {payment.method} · {payment.providerRef}
                    {payment.createdAt ? ` · ${formatDateTime(payment.createdAt)}` : ""}
                  </p>
                </div>
                <Badge
                  variant={payment.status === "completed" ? "default" : "outline"}
                  className="uppercase"
                >
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
