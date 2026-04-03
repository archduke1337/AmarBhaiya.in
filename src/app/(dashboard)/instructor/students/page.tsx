import Link from "next/link";
import { GraduationCap, TrendingUp, Users } from "lucide-react";

import {
  ActivityFeed,
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorStudents,
  type InstructorStudentItem,
} from "@/lib/appwrite/dashboard-data";
import { formatRelativeTime } from "@/lib/utils/format";

export default async function InstructorStudentsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const students = await getInstructorStudents({ userId: user.$id, role });

  const studentsNeedingAttention = [...students]
    .filter((student) => student.needsAttention)
    .sort((left, right) => {
      if (left.progressPercent !== right.progressPercent) {
        return left.progressPercent - right.progressPercent;
      }
      const leftTime = new Date(left.enrolledAt ?? "").getTime();
      const rightTime = new Date(right.enrolledAt ?? "").getTime();
      return leftTime - rightTime;
    });
  const nearCompletionStudents = [...students]
    .filter((student) => student.isNearCompletion)
    .sort((left, right) => {
      if (left.progressPercent !== right.progressPercent) {
        return right.progressPercent - left.progressPercent;
      }
      const leftTime = new Date(left.enrolledAt ?? "").getTime();
      const rightTime = new Date(right.enrolledAt ?? "").getTime();
      return rightTime - leftTime;
    });
  const recentEnrollments = [...students]
    .filter((student) => student.isNewEnrollment)
    .sort((left, right) => {
      const leftTime = new Date(left.enrolledAt ?? "").getTime();
      const rightTime = new Date(right.enrolledAt ?? "").getTime();
      return rightTime - leftTime;
    });
  const sortedStudents = [...students].sort((left, right) => {
    if (left.needsAttention !== right.needsAttention) {
      return left.needsAttention ? -1 : 1;
    }
    if (left.isNearCompletion !== right.isNearCompletion) {
      return left.isNearCompletion ? -1 : 1;
    }
    if (right.progressPercent !== left.progressPercent) {
      return right.progressPercent - left.progressPercent;
    }
    const leftTime = new Date(left.enrolledAt ?? "").getTime();
    const rightTime = new Date(right.enrolledAt ?? "").getTime();
    return rightTime - leftTime;
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Students"
        title="Learner Progress Overview"
        description={`${students.length} active enrollments across your courses. Use this page to spot students who need outreach and the ones closest to finishing.`}
        actions={
          <Link
            href="/instructor"
            className="inline-flex h-9 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to dashboard
          </Link>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Active Enrollments"
          value={students.length}
          icon={Users}
          description="Across all instructor-owned courses"
        />
        <StatCard
          label="Needs Attention"
          value={studentsNeedingAttention.length}
          icon={GraduationCap}
          description={
            studentsNeedingAttention.length > 0
              ? "Low progress after the first week"
              : "No stalled learners right now"
          }
        />
        <StatCard
          label="Near Completion"
          value={nearCompletionStudents.length}
          icon={TrendingUp}
          description="At 80% progress or higher"
        />
        <StatCard
          label="Recent Enrollments"
          value={recentEnrollments.length}
          icon={Users}
          description="Joined in the last 14 days"
        />
      </StatGrid>

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrolled students yet"
          description="Once students enroll in your published courses, their progress will appear here."
        />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div id="needs-attention" className="scroll-mt-24">
              <ActivityFeed
                title={`Needs Attention (${studentsNeedingAttention.length})`}
                emptyText="No students currently need a progress nudge."
                items={studentsNeedingAttention.slice(0, 5).map((student) => ({
                  id: `${student.courseId}-${student.id}`,
                  label: student.name,
                  description: `${student.courseTitle} · ${student.progressPercent}% complete`,
                  badge: "Outreach",
                  timestamp: student.enrolledAt
                    ? formatRelativeTime(student.enrolledAt)
                    : undefined,
                  href: `/instructor/students#student-${student.courseId}-${student.id}`,
                }))}
              />
            </div>

            <div id="near-completion" className="scroll-mt-24">
              <ActivityFeed
                title={`Near Completion (${nearCompletionStudents.length})`}
                emptyText="No learners are near course completion yet."
                items={nearCompletionStudents.slice(0, 5).map((student) => ({
                  id: `finish-${student.courseId}-${student.id}`,
                  label: student.name,
                  description: `${student.courseTitle} · ${student.progressPercent}% complete`,
                  badge: student.progressPercent >= 95 ? "Finish line" : "Momentum",
                  timestamp: student.enrolledAt
                    ? formatRelativeTime(student.enrolledAt)
                    : undefined,
                  href: `/instructor/students#student-${student.courseId}-${student.id}`,
                }))}
              />
            </div>
          </section>

          <section id="recent-enrollments" className="border border-border scroll-mt-24">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium">Recent Enrollments</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                New learners who joined in the last two weeks.
              </p>
            </div>

            {recentEnrollments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No new enrollments in the last 14 days.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentEnrollments.slice(0, 6).map((student) => (
                  <div
                    key={`recent-${student.courseId}-${student.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.courseTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{student.progressPercent}%</Badge>
                      <span className="text-xs text-muted-foreground">
                        {student.enrolledAt
                          ? formatRelativeTime(student.enrolledAt)
                          : "Recently joined"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="all-students" className="border border-border scroll-mt-24">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium">All Learners</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Every active enrollment, ordered to surface students who likely need attention first.
              </p>
            </div>

            <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1.1fr_1fr_1fr_140px_140px]">
              <span>Student</span>
              <span>Email</span>
              <span>Course</span>
              <span>Signals</span>
              <span>Progress</span>
            </div>

            <div className="divide-y divide-border">
              {sortedStudents.map((student) => (
                <StudentRow key={`${student.courseId}-${student.id}`} student={student} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StudentRow({ student }: { student: InstructorStudentItem }) {
  return (
    <article
      id={`student-${student.courseId}-${student.id}`}
      className="scroll-mt-24 px-5 py-4"
    >
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.1fr_1fr_1fr_140px_140px] md:items-center md:gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{student.name}</span>
          {student.enrolledAt ? (
            <span className="text-xs text-muted-foreground">
              Enrolled {formatRelativeTime(student.enrolledAt)}
            </span>
          ) : null}
        </div>

        <span className="text-sm text-muted-foreground">{student.email}</span>

        <div className="flex flex-col gap-1">
          <Link
            href={`/instructor/courses/${student.courseId}`}
            className="text-sm text-foreground transition-colors hover:text-muted-foreground"
          >
            {student.courseTitle}
          </Link>
          <span className="text-xs text-muted-foreground">
            Enrollment-specific progress
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {student.needsAttention ? (
            <Badge variant="destructive">Needs attention</Badge>
          ) : null}
          {student.isNearCompletion ? (
            <Badge variant="secondary">Near completion</Badge>
          ) : null}
          {student.isNewEnrollment ? (
            <Badge variant="outline">New</Badge>
          ) : null}
          {!student.needsAttention && !student.isNearCompletion && !student.isNewEnrollment ? (
            <Badge variant="outline">Steady</Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden bg-muted">
            <div
              className={`h-full transition-all ${
                student.progressPercent >= 100
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : student.needsAttention
                    ? "bg-amber-500 dark:bg-amber-400"
                    : "bg-foreground"
              }`}
              style={{ width: `${Math.max(2, student.progressPercent)}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {student.progressPercent}%
          </span>
        </div>
      </div>
    </article>
  );
}
