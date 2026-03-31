import { notFound } from "next/navigation";

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
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Curriculum Builder</p>
        <h1 className="text-3xl mt-2">Curriculum for {course.title}</h1>
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        {modules.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground lg:col-span-2">
            No modules found for this course yet.
          </article>
        ) : null}

        {modules.map((module) => (
          <article key={module.id} className="border border-border p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Module {module.order}
            </p>
            <h2 className="text-xl">{module.title}</h2>
            {module.lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>
            ) : null}
            <ul className="space-y-2 text-sm text-muted-foreground">
              {module.lessons.map((lesson) => (
                <li key={lesson.id} className="border border-border px-3 py-2">
                  Lesson {lesson.order}: {lesson.title}
                  {" · "}
                  {formatDuration(lesson.duration)}
                  {lesson.isFree ? " · Free" : ""}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
