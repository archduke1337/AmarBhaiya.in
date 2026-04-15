import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { getCourseComments, postCourseCommentAction } from "@/actions/comments";
import { enrollInCourseFormAction } from "@/actions/enrollment-form-wrapper";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="space-y-6 pb-6">
      <RetroPanel tone="card" size="lg" className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="ghost">{course.accessModel}</Badge>
          <Badge variant="secondary">{course.totalLessons} lessons</Badge>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Course overview
            </p>
            <h1 className="font-heading text-3xl font-black tracking-[-0.05em] md:text-5xl">
              {course.title}
            </h1>
            <p className="max-w-3xl text-sm font-medium leading-7 text-muted-foreground">
              Use this page to understand the structure before jumping in. Lesson-specific
              resources and doubts stay inside each lesson. Course-wide planning and
              general questions stay here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {firstVisibleLessonId ? (
              <Button asChild size="lg">
                <Link href={`/app/learn/${course.id}/${firstVisibleLessonId}`}>
                  {hasFullAccess ? "Start course" : "Start preview"}
                </Link>
              </Button>
            ) : null}

            {course.price === 0 && (
              <form action={enrollInCourseFormAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <Button type="submit" variant="secondary" size="lg">
                  Ensure free enrollment
                </Button>
              </form>
            )}

            {!hasFullAccess && isPaidCourse ? (
              <Button asChild variant="outline" size="lg">
                <Link href={courseHref}>View enrollment options</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </RetroPanel>

      {!hasFullAccess && isPaidCourse ? (
        <RetroPanel tone="muted" className="text-sm text-muted-foreground">
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
        </RetroPanel>
      ) : null}

      {visibleModules.length === 0 ? (
        <RetroPanel tone="muted" className="text-sm text-muted-foreground">
          {hasFullAccess
            ? "This course does not have any lessons yet."
            : "No free preview lessons are available for this course yet."}
        </RetroPanel>
      ) : (
        <section className="space-y-4">
          {visibleModules.map((module, moduleIndex) => (
            <RetroPanel key={module.id} tone={moduleIndex % 2 === 0 ? "card" : "accent"} className="space-y-0 p-0">
              <div className="border-b-2 border-border px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Module {moduleIndex + 1}
                </p>
                <h2 className="mt-1 font-heading text-2xl font-black tracking-[-0.04em]">
                  {module.title}
                </h2>
              </div>

              <ul className="divide-y-2 divide-border">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id}>
                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
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
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/app/learn/${course.id}/${lesson.id}`}>Open lesson</Link>
                        </Button>
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
            </RetroPanel>
          ))}
        </section>
      )}

      <RetroPanel tone="card" className="space-y-0 p-0">
        <div className="border-b-2 border-border px-5 py-3">
          <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
            Course Discussion ({courseComments.length})
          </h2>
        </div>

        {hasFullAccess ? (
          <>
            <form
              action={postCourseCommentAction}
              className="border-b-2 border-border p-5 space-y-3"
            >
              <input type="hidden" name="courseId" value={course.id} />
              <Textarea
                name="text"
                required
                minLength={2}
                placeholder="Ask about the course overall, planning, pacing, or general doubts..."
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Post to course discussion
                </Button>
              </div>
            </form>

            <div className="divide-y-2 divide-border">
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
                      <span className="border-2 border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
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
      </RetroPanel>
    </div>
  );
}
