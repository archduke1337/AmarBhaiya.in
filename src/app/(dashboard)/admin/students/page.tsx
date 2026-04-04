import Link from "next/link";
import { User } from "lucide-react";
import { Query } from "node-appwrite";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { getAdminCourses, getAdminUsers } from "@/lib/appwrite/dashboard-data";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { adminEnrollAction } from "@/actions/enrollment";
import { formatAdminCourseOption, formatAdminUserOption } from "@/lib/utils/admin-select";

type AnyRow = Record<string, unknown> & { $id: string };

async function getAllStudentProfiles() {
  const { tablesDB } = await createAdminClient();
  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.studentProfiles,
      queries: [Query.limit(200), Query.orderDesc("$createdAt")],
    });
    return result.rows as AnyRow[];
  } catch {
    return [];
  }
}

export default async function AdminStudentProfilesPage() {
  await requireRole(["admin"]);
  const [profiles, users, courses] = await Promise.all([
    getAllStudentProfiles(),
    getAdminUsers(),
    getAdminCourses(),
  ]);

  const studentOptions = users.filter((user) => user.role === "student");
  const courseOptions = [...courses].sort((left, right) => left.title.localeCompare(right.title));
  const canManuallyEnroll = studentOptions.length > 0 && courseOptions.length > 0;

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <PageHeader
        eyebrow="Admin · Student Data"
        title="Student Profiles"
        description={`${profiles.length} students have filled their profile information.`}
      />

      {/* Manual enrollment */}
      <section className="border border-border p-5 space-y-3">
        <h2 className="text-sm font-medium">Manual Enrollment</h2>
        <form action={adminEnrollAction} className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Student</span>
            <select
              name="userId"
              required
              disabled={!canManuallyEnroll}
              className="h-9 w-full border border-border bg-background px-3 text-xs disabled:opacity-60"
              defaultValue=""
            >
              <option value="" disabled>
                {studentOptions.length > 0 ? "Select student" : "No students available"}
              </option>
              {studentOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {formatAdminUserOption(user)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Course</span>
            <select
              name="courseId"
              required
              disabled={!canManuallyEnroll}
              className="h-9 w-full border border-border bg-background px-3 text-xs disabled:opacity-60"
              defaultValue=""
            >
              <option value="" disabled>
                {courseOptions.length > 0 ? "Select course" : "No courses available"}
              </option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {formatAdminCourseOption(course)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={!canManuallyEnroll}
            className="h-9 bg-foreground text-background text-xs transition-opacity hover:opacity-90"
          >
            Enroll Student
          </button>
        </form>
        <p className="text-xs text-muted-foreground">
          {canManuallyEnroll
            ? `${studentOptions.length} students and ${courseOptions.length} courses available for manual enrollment.`
            : "Manual enrollment is unavailable until at least one student and one course exist."}
        </p>
      </section>

      {profiles.length === 0 ? (
        <EmptyState
          icon={User}
          title="No student profiles yet"
          description="Students will appear here once they fill out their personal information from their dashboard."
        />
      ) : (
        <section className="border border-border">
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_100px_150px_100px_80px]">
            <span>User ID</span>
            <span>Grade</span>
            <span>School</span>
            <span>City</span>
            <span></span>
          </div>

          <div className="divide-y divide-border">
            {profiles.map((profile) => (
              <div
                key={profile.$id}
                className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-[1fr_100px_150px_100px_80px] md:items-center md:gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs">
                    {String(profile.userId ?? "")}
                  </span>
                  {typeof profile.guardianName === "string" &&
                    profile.guardianName.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Guardian: {profile.guardianName}
                      </span>
                    )}
                </div>
                <span className="text-sm">{String(profile.grade ?? "—")}</span>
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {String(profile.school ?? "—")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {String(profile.city ?? "—")}
                </span>
                <Link
                  href={`/admin/students/${String(profile.userId ?? "")}`}
                  className="text-xs underline underline-offset-4 hover:text-foreground text-muted-foreground"
                >
                  Details →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
