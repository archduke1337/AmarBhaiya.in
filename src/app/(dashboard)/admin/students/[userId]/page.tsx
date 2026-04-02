import { notFound } from "next/navigation";
import { Query } from "node-appwrite";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { adminUnenrollAction } from "@/actions/enrollment";
import { PageHeader } from "@/components/dashboard";

type AnyRow = Record<string, unknown> & { $id: string };

type PageProps = {
  params: Promise<{ userId: string }>;
};

async function getStudentDetail(userId: string) {
  const { tablesDB, users } = await createAdminClient();

  // Get user
  let userName = "Unknown";
  let userEmail = "";
  try {
    const u = await users.get(userId);
    userName = u.name || u.email;
    userEmail = u.email;
  } catch {
    // user may not exist
  }

  // Get profile
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

  // Get enrollments with course info
  type EnrollmentInfo = {
    id: string;
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    progress: number;
    status: string;
  };

  const enrollments: EnrollmentInfo[] = [];
  try {
    const enrollResult = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.enrollments,
      queries: [Query.equal("userId", [userId]), Query.limit(50)],
    });

    const enrollmentRows = enrollResult.rows as AnyRow[];
    const courseIds = Array.from(
      new Set(
        enrollmentRows
          .map((row) => String(row.courseId ?? ""))
          .filter((courseId) => courseId.length > 0)
      )
    );

    const courseTitleById = new Map<string, string>();
    if (courseIds.length > 0) {
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
        courseTitleById.set(row.$id, String(row.title ?? row.$id));
      }
    }

    for (const row of enrollmentRows) {
      const courseId = String(row.courseId ?? "");
      enrollments.push({
        id: row.$id,
        courseId,
        courseTitle: courseTitleById.get(courseId) ?? "Unknown Course",
        enrolledAt: String(row.enrolledAt ?? ""),
        progress: Number(row.progress ?? 0),
        status: String(row.status ?? "active"),
      });
    }
  } catch {
    // skip
  }

  // Get payments
  type PaymentInfo = {
    id: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    createdAt: string;
  };

  const payments: PaymentInfo[] = [];
  try {
    const payResult = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      queries: [Query.equal("userId", [userId]), Query.limit(50)],
    });

    for (const r of payResult.rows) {
      const row = r as AnyRow;
      payments.push({
        id: row.$id,
        amount: Number(row.amount ?? 0),
        currency: String(row.currency ?? "INR"),
        method: String(row.method ?? ""),
        status: String(row.status ?? ""),
        createdAt: String(row.createdAt ?? ""),
      });
    }
  } catch {
    // skip
  }

  return { userName, userEmail, profile, enrollments, payments };
}

export default async function AdminStudentDetailPage({ params }: PageProps) {
  await requireRole(["admin"]);
  const { userId } = await params;
  const data = await getStudentDetail(userId);

  if (!data.userName && !data.userEmail) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        eyebrow="Admin · Student Detail"
        title={data.userName}
        description={`${data.userEmail} · ${data.enrollments.length} enrollments · ${data.payments.length} payments`}
      />

      {/* Profile Info */}
      {data.profile && (
        <section className="border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Profile</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
            {["grade", "school", "city", "dateOfBirth", "guardianName", "phone"].map(
              (field) => {
                const value = String(
                  (data.profile as AnyRow)[field] ?? "—"
                );
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

      {/* Enrollments */}
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
            {data.enrollments.map((e) => (
              <div
                key={e.id}
                className="px-5 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium">{e.courseTitle}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Enrolled:{" "}
                    {e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleDateString("en-IN")
                      : "—"}{" "}
                    · Progress: {e.progress}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${
                      e.status === "active"
                        ? "border-emerald-500/30 text-emerald-600"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {e.status}
                  </span>
                  <form action={adminUnenrollAction}>
                    <input type="hidden" name="enrollmentId" value={e.id} />
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

      {/* Payments */}
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
            {data.payments.map((p) => (
              <div
                key={p.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm tabular-nums">
                    {p.currency} {(p.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.method} ·{" "}
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${
                    p.status === "completed"
                      ? "border-emerald-500/30 text-emerald-600"
                      : p.status === "failed"
                        ? "border-destructive/30 text-destructive"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
