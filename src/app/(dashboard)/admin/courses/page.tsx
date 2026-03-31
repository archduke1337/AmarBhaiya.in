import { updateCourseVisibilityAction } from "@/actions/operations";
import { getAdminCourses } from "@/lib/appwrite/dashboard-data";

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Courses</p>
        <h1 className="text-3xl mt-2">Course Oversight</h1>
      </div>

      <section className="space-y-3">
        {courses.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No courses found.
          </article>
        ) : null}

        {courses.map((course) => (
          <article key={course.id} className="border border-border p-5 space-y-3">
            <div>
              <h2 className="text-xl">{course.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Category: {course.category}
              </p>
            </div>

            <form action={updateCourseVisibilityAction} className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="courseId" value={course.id} />

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked={course.state === "published"}
                />
                Published
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={course.featured === "yes"}
                />
                Featured
              </label>

              <button
                type="submit"
                className="h-9 px-3 border border-border text-sm hover:bg-muted"
              >
                Save visibility
              </button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
