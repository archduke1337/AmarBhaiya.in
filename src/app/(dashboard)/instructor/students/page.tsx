import { Users, GraduationCap } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorStudents } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";

export default async function InstructorStudentsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const students = await getInstructorStudents({ userId: user.$id, role });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Students"
        title="Learner Progress Overview"
        description={`${students.length} enrolled students across your courses. Progress is calculated by completed lessons.`}
      />

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrolled students yet"
          description="Once students enroll in your published courses, their progress will appear here."
        />
      ) : (
        <section className="border border-border">
          {/* Table header */}
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_1fr_1fr_120px]">
            <span>Student</span>
            <span>Email</span>
            <span>Course</span>
            <span>Progress</span>
          </div>

          <div className="divide-y divide-border">
            {students.map((student) => (
              <div
                key={`${student.id}-${student.courseTitle}`}
                className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-[1fr_1fr_1fr_120px] md:items-center md:gap-4"
              >
                <span className="text-sm font-medium">{student.name}</span>

                <span className="text-sm text-muted-foreground">
                  {student.email}
                </span>

                <span className="text-sm text-muted-foreground line-clamp-1">
                  {student.courseTitle}
                </span>

                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden bg-muted">
                    <div
                      className={`h-full transition-all ${
                        student.progressPercent >= 100
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-foreground"
                      }`}
                      style={{
                        width: `${Math.max(2, student.progressPercent)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {student.progressPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
