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
import { requireRole } from "@/server/appwrite/auth";
import { getInstructorStudents } from "@/server/appwrite/dashboard-data";
import { formatRelativeTime } from "@/lib/utils/format";
import { InstructorStudentsTable } from "./students-table";

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
            className="inline-flex min-h-11 items-center px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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

          <section id="recent-enrollments" className="bg-surface border border-border/40 rounded-2xl scroll-mt-24 overflow-hidden">
            <div className="border-b border-border/40 px-5 py-3">
              <h2 className="font-heading text-xs font-black uppercase tracking-[0.15em]">Recent Enrollments</h2>
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

          <section id="all-students" className="bg-surface border border-border/40 rounded-2xl scroll-mt-24 overflow-hidden">
            <div className="border-b border-border/40 px-5 py-3">
              <h2 className="font-heading text-xs font-black uppercase tracking-[0.15em]">All Learners</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Every active enrollment, ordered to surface students who likely need attention first.
              </p>
            </div>

            <InstructorStudentsTable students={sortedStudents} />
          </section>
        </>
      )}
    </div>
  );
}
