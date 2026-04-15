import Link from "next/link";
import { BookOpen, ArrowRight, Award } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import { getStudentEnrolledCourses } from "@/lib/appwrite/dashboard-data";
import { getUserCertificates, issueCertificateAction } from "@/actions/certificate";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetroPanel } from "@/components/marketing/retro-panel";

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
        title="Keep your learning moving."
        description={`${courses.length} enrolled course${courses.length !== 1 ? "s" : ""} in your library, with ${completed.length} already completed.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/notes">Open notes</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/courses">Browse catalogue</Link>
            </Button>
          </div>
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
          <RetroPanel tone="accent" className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-heading text-[0.72rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Student library
              </p>
              <p className="text-sm font-medium leading-7 text-foreground/80">
                Notes help with quick revision. Courses are where the full sequence, quizzes, assignments, and live support come together.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{inProgress.length} in progress</Badge>
              <Badge variant="ghost">{completed.length} completed</Badge>
            </div>
          </RetroPanel>

          {/* In Progress */}
          {inProgress.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
                In Progress ({inProgress.length})
              </h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {inProgress.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
                Completed ({completed.length})
              </h2>
              <div className="grid gap-4 xl:grid-cols-2">
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
    <RetroPanel
      tone={isComplete ? "muted" : course.progressPercent >= 70 ? "secondary" : "card"}
      className="flex h-full flex-col gap-0 p-0 transition-transform hover:-translate-y-1"
    >
      <Link
        href={primaryHref}
        className="group flex flex-1 flex-col gap-4 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{course.category}</Badge>
            {isComplete ? <Badge variant="ghost">Completed</Badge> : null}
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {course.totalLessons} lessons
          </span>
        </div>

        <h3 className="font-heading text-2xl font-black leading-[0.96] tracking-[-0.04em] group-hover:underline">
          {course.title}
        </h3>

        {!isComplete && course.continueLessonTitle && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {course.resumePercent > 0
              ? `Resume ${course.continueLessonTitle} at ${course.resumePercent}%`
              : `Up next: ${course.continueLessonTitle}`}
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full border-2 border-border bg-[color:var(--surface-card)]">
            <div
              className={`h-full transition-all duration-500 ${
                isComplete
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.max(2, course.progressPercent)}%` }}
            />
          </div>
          <span className="text-xs tabular-nums font-black text-muted-foreground">
            {course.progressPercent}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-semibold">
            {course.completedLessons}/{course.totalLessons} lessons
          </span>
          <span className="flex shrink-0 items-center gap-1 font-semibold uppercase tracking-[0.12em] transition-colors group-hover:text-foreground">
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
        <div className="flex items-center justify-between border-t-2 border-border px-5 py-3">
          {certificate ? (
            <Link
              href={certificate.shareUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600 hover:underline"
            >
              <Award className="size-3.5" />
              View Certificate
            </Link>
          ) : (
            <form action={issueCertificateAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <Button type="submit" variant="outline" size="xs">
                <Award className="size-3.5" />
                Claim Certificate
              </Button>
            </form>
          )}
        </div>
      )}
    </RetroPanel>
  );
}
