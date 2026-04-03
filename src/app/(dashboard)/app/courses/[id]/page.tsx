import Link from "next/link";
import { notFound } from "next/navigation";

import { enrollInCourseFormAction } from "@/actions/enrollment-form-wrapper";
import { requireAuth } from "@/lib/appwrite/auth";
import { getPublicCourseBySlug } from "@/lib/appwrite/marketing-content";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoursePlayerPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;

  const course = await getPublicCourseBySlug(id);
  if (!course) {
    notFound();
  }

  const modules = course.curriculum.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
    })),
  }));
  const firstLessonId = modules.flatMap((module) => module.lessons)[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <section className="border border-border p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Course overview
          </p>
          <h1 className="text-3xl md:text-4xl mt-2">{course.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Use this overview to navigate into lessons. Attached resources and
            discussion now live inside the dedicated lesson viewer for each lesson.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {firstLessonId ? (
            <Link
              href={`/app/learn/${course.id}/${firstLessonId}`}
              className="inline-flex h-10 items-center bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
            >
              Start course
            </Link>
          ) : null}

          {course.priceInr === 0 && (
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
        </div>
      </section>

      {modules.length === 0 ? (
        <section className="border border-border p-5 text-sm text-muted-foreground">
          This course does not have any lessons yet.
        </section>
      ) : (
        <section className="space-y-4">
          {modules.map((module, moduleIndex) => (
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
                    <Link
                      href={`/app/learn/${course.id}/${lesson.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Lesson {lessonIndex + 1}: {lesson.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.durationMinutes > 0
                            ? `${lesson.durationMinutes} min`
                            : "Duration not set"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Open lesson
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
