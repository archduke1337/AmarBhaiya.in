import Link from "next/link";

import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorCourseList } from "@/lib/appwrite/dashboard-data";

export default async function InstructorCoursesPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const courses = await getInstructorCourseList({ userId: user.$id, role });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Instructor Courses</p>
          <h1 className="text-3xl mt-2">Your Course Library</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/instructor/categories"
            className="h-10 px-4 border border-border text-sm inline-flex items-center"
          >
            Categories
          </Link>
          <Link
            href="/instructor/courses/new"
            className="h-10 px-4 bg-foreground text-background text-sm inline-flex items-center"
          >
            New course
          </Link>
        </div>
      </div>

      <section className="border border-border p-4 text-sm text-muted-foreground">
        Keep course setup and curriculum updates on this page flow: open a course,
        edit metadata, then update lessons in curriculum builder.
      </section>

      <section className="space-y-3">
        {courses.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No courses found for this instructor scope yet.
          </article>
        ) : null}

        {courses.map((course) => (
          <article key={course.id} className="border border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl">{course.title}</h2>
                <p className="text-sm text-muted-foreground">Status: {course.status}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/instructor/courses/${course.id}`} className="text-sm underline underline-offset-4">
                  Edit details
                </Link>
                <Link href={`/instructor/courses/${course.id}/curriculum`} className="text-sm underline underline-offset-4">
                  Curriculum
                </Link>
              </div>
            </div>

            {course.shortDescription ? (
              <p className="text-sm text-muted-foreground">{course.shortDescription}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No short description added yet.</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
