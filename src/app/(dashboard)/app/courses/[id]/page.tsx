import { notFound } from "next/navigation";

import { CoursePlayer } from "@/components/course/course-player";
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

  return (
    <div className="space-y-6">
      <section className="border border-border p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Student player
          </p>
          <h1 className="text-3xl md:text-4xl mt-2">{course.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This player is now active in Phase 5 with lesson navigation, notes,
            resources, and comments.
          </p>
        </div>

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
      </section>

      <CoursePlayer
        courseTitle={course.title}
        modules={modules}
        resources={[]}
      />
    </div>
  );
}
