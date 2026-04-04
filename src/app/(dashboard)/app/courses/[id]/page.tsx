import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { getCourseComments, postCourseCommentAction } from "@/actions/comments";
import { enrollInCourseFormAction } from "@/actions/enrollment-form-wrapper";
import { requireAuth } from "@/lib/appwrite/auth";
import { userHasCourseAccess } from "@/lib/appwrite/access";
import { getPublicCourseBySlug } from "@/lib/appwrite/dashboard-data";
import { formatRelativeTime } from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoursePlayerPage({ params }: PageProps) {
  const user = await requireAuth();
  const { id } = await params;

  const course = await getPublicCourseBySlug(id);
  if (!course) {
    notFound();
  }

  const hasFullAccess = await userHasCourseAccess({
    courseId: course.id,
    userId: user.$id,
  });
  const courseComments = hasFullAccess ? await getCourseComments(course.id) : [];

  const modules = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationMinutes: Math.max(0, Math.round(lesson.duration / 60)),
      isFree: lesson.isFree,
      isFreePreview: lesson.isFreePreview,
    })),
  }));

  const previewModules = modules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => lesson.isFree || lesson.isFreePreview),
    }))
    .filter((module) => module.lessons.length > 0);

  const visibleModules = hasFullAccess ? modules : previewModules;
  const firstVisibleLessonId =
    visibleModules.flatMap((module) => module.lessons)[0]?.id ?? "";
  const courseHref = `/courses/${course.slug || course.id}`;
  const isPaidCourse = course.accessModel !== "free";

  return (
    <div className="space-y-6">
      <section className="border border-border p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Course overview
          </p>
          <h1 className="text-3xl md:text-4xl mt-2">{course.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Use this overview to navigate into lessons. Lesson-specific resources
            and discussion stay inside each lesson viewer, while the course-wide
            conversation lives below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {firstVisibleLessonId ? (
            <Link
              href={`/app/learn/${course.id}/${firstVisibleLessonId}`}
              className="inline-flex h-10 items-center bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
            >
              {hasFullAccess ? "Start course" : "Start preview"}
            </Link>
          ) : null}

          {course.price === 0 && (
            <form action={enrollInCourseFormAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                className="h-10 px-4 border border-border text-sm hover:bg-accent"
              >
                Ensure free enrollment
              </button>
            </form>
          )}

          {!hasFullAccess && isPaidCourse ? (
            <Link
              href={courseHref}
              className="inline-flex h-10 items-center border border-border px-4 text-sm transition-colors hover:bg-accent"
            >
              View enrollment options
            </Link>
          ) : null}
        </div>
      </section>

      {!hasFullAccess && isPaidCourse ? (
        <section className="border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Full course streaming is locked until you enroll.
              </p>
              <p>
                You can still access any free preview lessons listed below. The
                rest of the lesson videos, resources, and course discussion stay
                gated behind course access.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {visibleModules.length === 0 ? (
        <section className="border border-border p-5 text-sm text-muted-foreground">
          {hasFullAccess
            ? "This course does not have any lessons yet."
            : "No free preview lessons are available for this course yet."}
        </section>
      ) : (
        <section className="space-y-4">
          {visibleModules.map((module, moduleIndex) => (
            <article key={module.id} className="border border-border">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Module {moduleIndex + 1}
                </p>
                <h2 className="mt-1 text-lg font-medium">{module.title}</h2>
              </div>

              <ul className="divide-y divide-border">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id}>
                    <div className="flex items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="text-sm font-medium">
                          Lesson {lessonIndex + 1}: {lesson.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.durationMinutes > 0
                            ? `${lesson.durationMinutes} min`
                            : "Duration not set"}
                          {!hasFullAccess && (lesson.isFree || lesson.isFreePreview)
                            ? " · Preview available"
                            : ""}
                        </p>
                      </div>

                      {hasFullAccess || lesson.isFree || lesson.isFreePreview ? (
                        <Link
                          href={`/app/learn/${course.id}/${lesson.id}`}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Open lesson
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="size-3" />
                          Locked
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}

      <section className="border border-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">
            Course Discussion ({courseComments.length})
          </h2>
        </div>

        {hasFullAccess ? (
          <>
            <form
              action={postCourseCommentAction}
              className="border-b border-border p-5 space-y-3"
            >
              <input type="hidden" name="courseId" value={course.id} />
              <textarea
                name="text"
                required
                minLength={2}
                placeholder="Ask about the course overall, planning, pacing, or general doubts..."
                className="w-full min-h-20 border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="h-9 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
                >
                  Post to course discussion
                </button>
              </div>
            </form>

            <div className="divide-y divide-border">
              {courseComments.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No course-wide comments yet. Start the conversation.
                </p>
              ) : null}
              {courseComments.map((comment) => (
                <div key={comment.id} className="px-5 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium">{comment.userName}</span>
                    {comment.userRole !== "student" ? (
                      <span className="border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {comment.userRole}
                      </span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground">
                      {comment.createdAt ? formatRelativeTime(comment.createdAt) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-4 text-sm text-muted-foreground">
            Enroll in this course to join the course-wide discussion.
          </div>
        )}
      </section>
    </div>
  );
}
