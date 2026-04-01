import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createCurriculumLessonAction,
  createCurriculumModuleAction,
  updateCurriculumLessonAction,
  updateCurriculumModuleAction,
} from "@/actions/operations";
import { deleteModuleAction, deleteLessonAction } from "@/actions/delete";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorCourseSummary,
  getInstructorCurriculum,
} from "@/lib/appwrite/dashboard-data";
import { formatDuration } from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCurriculumPage({ params }: PageProps) {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const { id } = await params;
  const course = await getInstructorCourseSummary({ userId: user.$id, role }, id);

  if (!course) {
    notFound();
  }

  const modules = await getInstructorCurriculum(course.id);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Curriculum Builder</p>
        <h1 className="text-3xl mt-2">Curriculum for {course.title}</h1>
        </div>
        <Link
          href={`/instructor/courses/${course.id}`}
          className="text-sm underline underline-offset-4"
        >
          Back to course details
        </Link>
      </div>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Create module</h2>
        <form action={createCurriculumModuleAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm">
            <span>Module title</span>
            <input
              name="title"
              required
              minLength={4}
              placeholder="Module 1 - Foundations"
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm md:max-w-xs">
            <span>Order</span>
            <input
              name="order"
              type="number"
              min={0}
              defaultValue={0}
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span>Description</span>
            <textarea
              name="description"
              rows={2}
              placeholder="What this module covers"
              className="w-full border border-border bg-background px-3 py-2"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="h-10 px-4 bg-foreground text-background text-sm"
            >
              Add module
            </button>
          </div>
        </form>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        {modules.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground lg:col-span-2">
            No modules found for this course yet.
          </article>
        ) : null}

        {modules.map((module) => (
          <article key={module.id} className="border border-border p-5 space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Module {module.order}
            </p>

            <form action={updateCurriculumModuleAction} className="grid gap-3">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="moduleId" value={module.id} />

              <label className="space-y-1 text-sm">
                <span>Module title</span>
                <input
                  name="title"
                  required
                  minLength={4}
                  defaultValue={module.title}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={module.description}
                  className="w-full border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm md:max-w-xs">
                <span>Order</span>
                <input
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={module.order}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <div className="flex justify-between">
                <form action={deleteModuleAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <input type="hidden" name="moduleId" value={module.id} />
                  <button
                    type="submit"
                    className="h-9 px-3 border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Delete module
                  </button>
                </form>
                <button
                  type="submit"
                  className="h-9 px-3 border border-border text-sm hover:bg-muted"
                >
                  Update module
                </button>
              </div>
            </form>

            <form action={createCurriculumLessonAction} className="border border-border p-4 space-y-3">
              <input type="hidden" name="courseId" value={course.id} />
              <input type="hidden" name="moduleId" value={module.id} />

              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Add lesson</h3>

              <label className="space-y-1 text-sm block">
                <span>Lesson title</span>
                <input
                  name="title"
                  required
                  minLength={4}
                  placeholder="Lesson title"
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm block">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional lesson summary"
                  className="w-full border border-border bg-background px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span>Duration (seconds)</span>
                  <input
                    name="durationSeconds"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="h-10 w-full border border-border bg-background px-3"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Order</span>
                  <input
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={module.lessons.length + 1}
                    className="h-10 w-full border border-border bg-background px-3"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFree" defaultChecked />
                Free lesson
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFreePreview" />
                Free preview (demo for paid courses)
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="h-9 px-3 bg-foreground text-background text-sm"
                >
                  Add lesson
                </button>
              </div>
            </form>

            {module.lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>
            ) : null}

            <ul className="space-y-3 text-sm text-muted-foreground">
              {module.lessons.map((lesson) => (
                <li key={lesson.id} className="border border-border p-3 space-y-3">
                  <p className="text-xs uppercase tracking-widest">
                    Lesson {lesson.order} · {formatDuration(lesson.duration)}
                    {lesson.isFree ? " · Free" : ""}
                  </p>

                  <form action={updateCurriculumLessonAction} className="grid gap-3">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={module.id} />
                    <input type="hidden" name="lessonId" value={lesson.id} />

                    <label className="space-y-1 text-sm">
                      <span>Lesson title</span>
                      <input
                        name="title"
                        required
                        minLength={4}
                        defaultValue={lesson.title}
                        className="h-10 w-full border border-border bg-background px-3"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span>Description</span>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={lesson.description}
                        className="w-full border border-border bg-background px-3 py-2"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1 text-sm">
                        <span>Duration (seconds)</span>
                        <input
                          name="durationSeconds"
                          type="number"
                          min={0}
                          defaultValue={lesson.duration}
                          className="h-10 w-full border border-border bg-background px-3"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span>Order</span>
                        <input
                          name="order"
                          type="number"
                          min={0}
                          defaultValue={lesson.order}
                          className="h-10 w-full border border-border bg-background px-3"
                        />
                      </label>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" name="isFree" defaultChecked={lesson.isFree} />
                      Free lesson
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" name="isFreePreview" defaultChecked={lesson.isFreePreview} />
                      Free preview (demo for paid courses)
                    </label>

                    <div className="flex justify-between">
                      <form action={deleteLessonAction}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <button
                          type="submit"
                          className="h-9 px-3 border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Delete
                        </button>
                      </form>
                      <button
                        type="submit"
                        className="h-9 px-3 border border-border text-sm hover:bg-muted"
                      >
                        Save lesson
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
