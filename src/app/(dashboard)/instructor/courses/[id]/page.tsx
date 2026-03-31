import { notFound } from "next/navigation";

import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorCourseSummary } from "@/lib/appwrite/dashboard-data";
import { formatCurrency, formatDuration } from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCourseEditPage({ params }: PageProps) {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const { id } = await params;
  const course = await getInstructorCourseSummary({ userId: user.$id, role }, id);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course Editor</p>
        <h1 className="text-3xl mt-2">Edit course: {course.title}</h1>
      </div>

      <section className="border border-border p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Course metadata below is loaded from Appwrite so you can verify publish
          state, pricing model, and lesson volume before editing.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Publish state</p>
            <p>{course.isPublished ? "Published" : "Draft"}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Access model</p>
            <p className="capitalize">{course.accessModel}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Price</p>
            <p>{course.price > 0 ? formatCurrency(course.price) : "Free"}</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Lesson Stats</p>
            <p>
              {course.totalLessons} lessons · {formatDuration(course.totalDuration)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
