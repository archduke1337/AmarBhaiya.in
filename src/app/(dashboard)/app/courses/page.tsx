import Link from "next/link";
import { BookOpen, ArrowRight, Award } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { getStudentEnrolledCourses } from "@/lib/appwrite/dashboard-data";
import { getUserCertificates, issueCertificateAction } from "@/actions/certificate";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function StudentCoursesPage() {
  const user = await requireAuth();
  const [courses, certificates] = await Promise.all([
    getStudentEnrolledCourses(user.$id),
    getUserCertificates(),
  ]);

  const certByCourseId = new Map(
    certificates.map((c) => [c.courseId, c])
  );

  const inProgress = courses.filter((c) => c.progressPercent < 100);
  const completed = courses.filter((c) => c.progressPercent >= 100);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="My Courses"
        title="Continue your learning streak."
        description={`${courses.length} enrolled course${courses.length !== 1 ? "s" : ""} · ${completed.length} completed`}
        actions={
          <Link
            href="/courses"
            className="inline-flex h-9 items-center gap-2 border border-border px-4 text-sm transition-colors hover:bg-muted"
          >
            Browse catalogue
          </Link>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You haven't enrolled in any courses yet"
          description="Browse the course catalogue and find something that interests you."
          action={{ label: "Explore courses", href: "/courses" }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* In Progress */}
          {inProgress.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                In Progress ({inProgress.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {inProgress.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Completed ({completed.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {completed.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    certificate={certByCourseId.get(course.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  certificate,
}: {
  course: {
    id: string;
    title: string;
    slug: string;
    category: string;
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    continueHref: string;
    continueLessonTitle: string;
    resumePercent: number;
  };
  certificate?: { id: string; shareUrl: string };
}) {
  const isComplete = course.progressPercent >= 100;
  const primaryHref = isComplete ? `/app/courses/${course.slug || course.id}` : course.continueHref;

  return (
    <div className="flex flex-col border border-border transition-colors hover:border-foreground/20">
      <Link
        href={primaryHref}
        className="group flex flex-col gap-4 p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">{course.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {course.totalLessons} lessons
          </span>
        </div>

        <h3 className="text-lg font-medium leading-tight group-hover:underline">
          {course.title}
        </h3>

        {!isComplete && course.continueLessonTitle && (
          <p className="text-xs text-muted-foreground">
            {course.resumePercent > 0
              ? `Resume ${course.continueLessonTitle} at ${course.resumePercent}%`
              : `Up next: ${course.continueLessonTitle}`}
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden bg-muted">
            <div
              className={`h-full transition-all duration-500 ${
                isComplete
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : "bg-foreground"
              }`}
              style={{ width: `${Math.max(2, course.progressPercent)}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {course.progressPercent}%
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {course.completedLessons}/{course.totalLessons} lessons
          </span>
          <span className="flex items-center gap-1 transition-colors group-hover:text-foreground">
            <ArrowRight className="size-3" />
            {isComplete
              ? "Review"
              : course.resumePercent > 0
                ? "Resume"
                : "Continue"}
          </span>
        </div>
      </Link>

      {/* Certificate CTA for completed courses */}
      {isComplete && (
        <div className="border-t border-border px-5 py-3 flex items-center justify-between">
          {certificate ? (
            <Link
              href={certificate.shareUrl}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline"
            >
              <Award className="size-3.5" />
              View Certificate
            </Link>
          ) : (
            <form action={issueCertificateAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 h-8 border border-border px-3 text-xs transition-colors hover:bg-muted"
              >
                <Award className="size-3.5" />
                Claim Certificate
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
