import Link from "next/link";

import { requireAuth } from "@/lib/appwrite/auth";
import { getPublicCoursesPageData } from "@/lib/appwrite/marketing-content";

export default async function StudentCoursesPage() {
  await requireAuth();
  const { courses } = await getPublicCoursesPageData({ sort: "popular" });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          My Courses
        </p>
        <h1 className="text-3xl md:text-4xl">Continue your learning streak.</h1>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {courses.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No published courses are available yet.
          </article>
        ) : null}

        {courses.map((course) => (
          <article key={course.slug} className="border border-border p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground border border-border px-2 py-1">
                {course.category}
              </p>
              <p className="text-sm text-muted-foreground">{course.totalLessons} lessons</p>
            </div>

            <h2 className="text-2xl leading-tight">{course.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {course.shortDescription}
            </p>

            <div className="pt-2">
              <Link
                href={`/app/courses/${course.slug}`}
                className="inline-flex h-9 items-center px-4 bg-foreground text-background text-sm"
              >
                Open player
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
