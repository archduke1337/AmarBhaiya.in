import { User, GraduationCap } from "lucide-react";
import { Query } from "node-appwrite";

import { requireRole } from "@/server/appwrite/auth";
import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import { getAdminCourses, getAdminUsers } from "@/server/appwrite/dashboard-data";
import { createAdminClient } from "@/server/appwrite/server";
import {
  listAllRows,
} from "@/server/appwrite/row-pagination";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminEnrollFormAction } from "@/server/actions/enrollment-form-wrapper";
import { formatAdminCourseOption, formatAdminUserOption } from "@/lib/utils/admin-select";
import { AdminStudentsTable } from "./students-table";

async function getAllStudentProfiles() {
  const { tablesDB } = await createAdminClient();
  try {
    return await listAllRows(tablesDB, APPWRITE_CONFIG.tables.studentProfiles, [
      Query.orderDesc("$createdAt"),
    ]);
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
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <GraduationCap className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Manual Enrollment
            </h2>
            <p className="text-xs text-muted-foreground">
              Enroll a student in a course directly from the admin panel.
            </p>
          </div>
        </div>
        <form action={adminEnrollFormAction} className="flex flex-col gap-4 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Student</span>
              <select
                name="userId"
                required
                disabled={!canManuallyEnroll}
                className="input-field--select w-full h-9 text-sm disabled:opacity-60"
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
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Course</span>
              <select
                name="courseId"
                required
                disabled={!canManuallyEnroll}
                className="input-field--select w-full h-9 text-sm disabled:opacity-60"
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
            <div className="flex items-end">
              <Button
                type="submit"
                size="sm"
                disabled={!canManuallyEnroll}
                className="w-full"
              >
                <GraduationCap className="size-3.5" />
                Enroll Student
              </Button>
            </div>
          </div>
        </form>
        <div className="border-t border-border/40 bg-surface-hover px-5 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground">
            {canManuallyEnroll
              ? `${studentOptions.length} students and ${courseOptions.length} courses available for manual enrollment.`
              : "Manual enrollment is unavailable until at least one student and one course exist."}
          </p>
        </div>
      </section>

      {profiles.length === 0 ? (
        <EmptyState
          icon={User}
          title="No student profiles yet"
          description="Students will appear here once they fill out their personal information from their dashboard."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
          <div className="flex items-center justify-between border-b border-border/40 bg-surface-hover px-5 py-3.5">
            <div>
              <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
                Student Profiles
              </h2>
              <p className="text-xs text-muted-foreground">{profiles.length} records</p>
            </div>
            <Badge variant="outline">{profiles.length} students</Badge>
          </div>

          <AdminStudentsTable profiles={profiles} />
        </section>
      )}
    </div>
  );
}
