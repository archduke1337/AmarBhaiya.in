import Link from "next/link";
import { BookOpen, ArrowRight, Award } from "lucide-react";
import { Button } from "@heroui/react";

import { requireAuth } from "@/lib/appwrite/auth";
import { getStudentEnrolledCourses } from "@/lib/appwrite/dashboard-data";
import { getUserCertificates, issueCertificateAction } from "@/actions/certificate";
import { PageHeader, EmptyState } from "@/components/dashboard";

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
    <div className="flex flex-col gap-8 animate-fade-in-up pb-[10vh]">
      <PageHeader
        eyebrow="My Courses"
        title="Keep your learning moving."
        description={`${courses.length} enrolled course${courses.length !== 1 ? "s" : ""} in your library, with ${completed.length} already completed.`}
        actions={
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Link href="/notes">
              <Button variant="bordered" className="bg-surface font-bold border-border/40" size="sm">
                Notes
              </Button>
            </Link>
            <Link href="/courses">
              <Button color="primary" variant="solid" className="font-bold shadow-[0_4px_16px_color-mix(in_oklab,var(--accent)_30%,transparent)]" size="sm">
                Browse catalogue
              </Button>
            </Link>
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
        <div className="flex flex-col gap-8">
          <div className="card-bezel my-2" style={{ background: "color-mix(in oklab, var(--surface) 80%, var(--accent) 5%)" }}>
            <div className="card-bezel-inner p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="eyebrow">
                  Student library
                </p>
                <p className="text-sm font-medium leading-relaxed text-foreground/80 max-w-2xl mt-1">
                  Notes help with quick revision. Courses are where the full sequence, quizzes, assignments, and live support come together.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded bg-surface/50 border border-border/40 shrink-0 text-foreground/70">
                    {inProgress.length} in progress
                 </span>
                 <span className="text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded bg-success/10 text-success shrink-0">
                    {completed.length} completed
                 </span>
              </div>
            </div>
          </div>

          {/* In Progress */}
          {inProgress.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-black tracking-[-0.03em] flex items-center gap-2">
                In Progress 
                <span className="text-sm font-semibold bg-surface border border-border/40 text-foreground/50 px-2 py-0.5 rounded-full">{inProgress.length}</span>
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
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-black tracking-[-0.03em] flex items-center gap-2">
                Completed 
                <span className="text-sm font-semibold bg-success/10 text-success px-2 py-0.5 rounded-full">{completed.length}</span>
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
    <div
      className={`flex flex-col p-5 rounded-2xl border transition-all hover:shadow-[var(--surface-shadow)] hover:-translate-y-[2px] ${
        isComplete
          ? "bg-surface/50 border-border/30 opacity-90"
          : "bg-surface border-border/40 hover:bg-surface-hover hover:border-border/60"
      }`}
    >
      <Link
        href={primaryHref}
        className="group flex flex-1 flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded bg-surface/50 border border-border/40 shrink-0 text-foreground/70">
               {course.category}
            </span>
            {isComplete ? (
              <span className="text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded bg-success/10 text-success shrink-0">
                 Completed
              </span>
            ) : null}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/40">
            {course.totalLessons} lessons
          </span>
        </div>

        <h3 className="text-xl font-black leading-tight tracking-[-0.03em] group-hover:text-accent transition-colors">
          {course.title}
        </h3>

        {!isComplete && course.continueLessonTitle && (
          <p className="text-xs font-medium text-foreground/50">
            {course.resumePercent > 0
              ? `Resume ${course.continueLessonTitle} at ${course.resumePercent}%`
              : `Up next: ${course.continueLessonTitle}`}
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-border/20 bg-surface-hover">
            <div
              className={`h-full transition-all duration-700 w-0 ${
                isComplete ? "bg-success" : "bg-accent"
              }`}
              style={{ width: `${Math.max(2, course.progressPercent)}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums font-black text-foreground/60 w-8 text-right">
            {course.progressPercent}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/30 text-xs mt-auto">
          <span className="font-semibold text-foreground/50">
            {course.completedLessons}/{course.totalLessons} lessons
          </span>
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-[0.1em] transition-colors group-hover:text-accent">
            {isComplete ? "Review" : course.resumePercent > 0 ? "Resume" : "Continue"}
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>

      {/* Certificate CTA for completed courses */}
      {isComplete && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
          {certificate ? (
            <Link
              href={certificate.shareUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-success hover:underline hover:text-success/80"
            >
              <Award className="size-3.5" />
              View Certificate
            </Link>
          ) : (
            <form action={issueCertificateAction} className="w-full">
              <input type="hidden" name="courseId" value={course.id} />
              <Button type="submit" variant="faded" size="sm" className="font-bold border-success/40 text-success hover:bg-success hover:text-success-foreground hover:border-success w-full justify-center">
                <Award className="size-3.5 mr-1" />
                Claim Certificate
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
