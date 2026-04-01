import Link from "next/link";
import { Plus, BookOpen, ArrowRight, Layers } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorCourseList } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function InstructorCoursesPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const courses = await getInstructorCourseList({ userId: user.$id, role });

  const published = courses.filter((c) => c.status === "Published");
  const drafts = courses.filter((c) => c.status === "Draft");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Courses"
        title="Your Course Library"
        description={`${courses.length} total — ${published.length} published, ${drafts.length} in draft`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/instructor/categories"
              className="inline-flex h-9 items-center gap-2 border border-border px-4 text-sm transition-colors hover:bg-muted"
            >
              Categories
            </Link>
            <Link
              href="/instructor/courses/new"
              className="inline-flex h-9 items-center gap-2 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              New Course
            </Link>
          </div>
        }
      />

      {/* Info banner */}
      <section className="border border-border bg-muted/30 px-5 py-3 text-sm text-muted-foreground">
        Open a course → edit metadata → update lessons via the curriculum builder. Courses must be
        published to appear in the student catalogue.
      </section>

      {courses.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No courses yet"
          description="Create your first course to start building your teaching portfolio."
          action={{ label: "Create course", href: "/instructor/courses/new" }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="group border border-border transition-colors hover:border-foreground/20"
            >
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-medium">{course.title}</h2>
                    <Badge
                      variant={course.status === "Published" ? "default" : "outline"}
                    >
                      {course.status}
                    </Badge>
                  </div>
                  {course.shortDescription ? (
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {course.shortDescription}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No description yet
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/instructor/courses/${course.id}`}
                    className="inline-flex h-8 items-center gap-1.5 border border-border px-3 text-xs transition-colors hover:bg-muted"
                  >
                    Edit Details
                  </Link>
                  <Link
                    href={`/instructor/courses/${course.id}/curriculum`}
                    className="inline-flex h-8 items-center gap-1.5 border border-border px-3 text-xs transition-colors hover:bg-muted"
                  >
                    Curriculum
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
