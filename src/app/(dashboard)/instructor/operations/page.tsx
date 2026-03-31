import {
  createCurriculumLessonAction,
  createCurriculumModuleAction,
  updateInstructorCourseAction,
} from "@/actions/operations";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorCourseList,
  getInstructorCourseSummary,
  getInstructorCurriculum,
} from "@/lib/appwrite/dashboard-data";

export default async function InstructorOperationsPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const courseList = await getInstructorCourseList({ userId: user.$id, role });

  const rawSummaries = await Promise.all(
    courseList.map((course) =>
      getInstructorCourseSummary({ userId: user.$id, role }, course.id)
    )
  );

  const courseSummaries = rawSummaries.filter(
    (course): course is NonNullable<(typeof rawSummaries)[number]> => course !== null
  );

  const curriculumByCourse = await Promise.all(
    courseSummaries.map(async (course) => ({
      course,
      modules: await getInstructorCurriculum(course.id),
    }))
  );

  const moduleOptions = curriculumByCourse.flatMap(({ course, modules }) =>
    modules.map((module) => ({
      id: module.id,
      title: module.title,
      courseId: course.id,
      courseTitle: course.title,
    }))
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Instructor Operations</p>
        <h1 className="text-3xl md:text-4xl">Course Operations Workspace</h1>
        <p className="text-muted-foreground max-w-3xl">
          Edit course settings, publish updates, and manage curriculum entities from one control panel.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">Update course settings</h2>
        {courseSummaries.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No courses available yet. Create your first draft in the course creation flow.
          </article>
        ) : null}

        {courseSummaries.map((course) => (
          <article key={course.id} className="border border-border p-5 space-y-4">
            <div>
              <h3 className="text-lg">{course.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">Course ID: {course.id}</p>
            </div>

            <form action={updateInstructorCourseAction} className="space-y-3">
              <input type="hidden" name="courseId" value={course.id} />
              <input
                name="title"
                defaultValue={course.title}
                className="w-full h-11 border border-border bg-background px-3"
                minLength={6}
                required
              />
              <textarea
                name="shortDescription"
                defaultValue={course.shortDescription}
                className="w-full min-h-24 border border-border bg-background px-3 py-2"
                minLength={12}
                required
              />

              <div className="grid md:grid-cols-3 gap-3">
                <select
                  name="accessModel"
                  defaultValue={course.accessModel}
                  className="w-full h-11 border border-border bg-background px-3"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="subscription">Subscription</option>
                </select>

                <input
                  name="price"
                  type="number"
                  min={0}
                  defaultValue={course.price}
                  className="w-full h-11 border border-border bg-background px-3"
                />

                <select
                  name="isPublished"
                  defaultValue={course.isPublished ? "true" : "false"}
                  className="w-full h-11 border border-border bg-background px-3"
                >
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>

              <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
                Save course settings
              </button>
            </form>
          </article>
        ))}
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Create module</h2>
          {courseSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a course first to start adding modules.
            </p>
          ) : (
            <form action={createCurriculumModuleAction} className="space-y-3">
              <select
                name="courseId"
                className="w-full h-11 border border-border bg-background px-3"
                required
                defaultValue={courseSummaries[0]?.id ?? ""}
              >
                {courseSummaries.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <input
                name="title"
                className="w-full h-11 border border-border bg-background px-3"
                placeholder="Module title"
                required
                minLength={4}
              />
              <textarea
                name="description"
                className="w-full min-h-20 border border-border bg-background px-3 py-2"
                placeholder="Module description"
              />
              <input
                name="order"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full h-11 border border-border bg-background px-3"
              />
              <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
                Add module
              </button>
            </form>
          )}
        </article>

        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Create lesson</h2>
          {courseSummaries.length === 0 || moduleOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add a module first before creating lessons.
            </p>
          ) : (
            <form action={createCurriculumLessonAction} className="space-y-3">
              <select
                name="courseId"
                className="w-full h-11 border border-border bg-background px-3"
                required
                defaultValue={courseSummaries[0]?.id ?? ""}
              >
                {courseSummaries.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              <select
                name="moduleId"
                className="w-full h-11 border border-border bg-background px-3"
                required
                defaultValue={moduleOptions[0]?.id ?? ""}
              >
                {moduleOptions.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.courseTitle} - {module.title}
                  </option>
                ))}
              </select>

              <input
                name="title"
                className="w-full h-11 border border-border bg-background px-3"
                placeholder="Lesson title"
                required
                minLength={4}
              />
              <textarea
                name="description"
                className="w-full min-h-20 border border-border bg-background px-3 py-2"
                placeholder="Lesson description"
              />

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  name="durationSeconds"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full h-11 border border-border bg-background px-3"
                  placeholder="Duration seconds"
                />
                <input
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full h-11 border border-border bg-background px-3"
                  placeholder="Order"
                />
                <select
                  name="isFree"
                  className="w-full h-11 border border-border bg-background px-3"
                  defaultValue="false"
                >
                  <option value="false">Paid lesson</option>
                  <option value="true">Free preview</option>
                </select>
              </div>

              <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
                Add lesson
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}