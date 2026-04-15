import { BookOpen, Eye, Star, Layers } from "lucide-react";

import { deleteCourseAction } from "@/actions/delete";
import { updateCourseVisibilityAction } from "@/actions/operations";
import { getAdminCourses } from "@/lib/appwrite/dashboard-data";
import { PageHeader, StatGrid, StatCard, EmptyState } from "@/components/dashboard";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();

  const published = courses.filter((c) => c.state === "published").length;
  const drafts = courses.filter((c) => c.state === "draft").length;
  const featured = courses.filter((c) => c.featured === "yes").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Courses"
        title="Course Oversight"
        description="Review every course before it reaches students. Keep publication, featured placement, and catalogue quality in one calm control room."
      />

      <StatGrid columns={3}>
        <StatCard label="Total Courses" value={courses.length} icon={BookOpen} />
        <StatCard
          label="Published"
          value={published}
          icon={Eye}
          description={`${drafts} in draft`}
        />
        <StatCard
          label="Featured"
          value={featured}
          icon={Star}
          description="Shown on homepage"
        />
      </StatGrid>

      {courses.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No courses found"
          description="Instructors can create courses from their dashboard. They will appear here for admin review."
        />
        ) : (
          <RetroPanel tone="card" className="overflow-hidden p-0">
            {/* Table header */}
            <div className="hidden items-center gap-4 border-b-2 border-border bg-[color:var(--surface-secondary)] px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_120px_100px_100px_220px]">
              <span>Course</span>
              <span>Category</span>
              <span>Status</span>
              <span>Featured</span>
              <span>Actions</span>
          </div>

          <div className="divide-y divide-border">
            {courses.map((course) => (
              <form
                key={course.id}
                action={updateCourseVisibilityAction}
                className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1fr_120px_100px_100px_220px] md:items-center md:gap-4"
              >
                <input type="hidden" name="courseId" value={course.id} />

                <div>
                  <h3 className="text-sm font-semibold">{course.title}</h3>
                </div>

                <Badge variant="outline" className="w-fit text-xs">
                  {course.category}
                </Badge>

                <label className="inline-flex min-h-10 items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3 shadow-retro-sm">
                  <input
                    type="checkbox"
                    name="isPublished"
                    defaultChecked={course.state === "published"}
                    className="size-4 accent-foreground"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">Published</span>
                </label>

                <label className="inline-flex min-h-10 items-center gap-2 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3 shadow-retro-sm">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    defaultChecked={course.featured === "yes"}
                    className="size-4 accent-foreground"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">Featured</span>
                </label>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="xs"
                  >
                    Save
                  </Button>
                  <Button
                    type="submit"
                    formAction={deleteCourseAction}
                    formNoValidate
                    variant="destructive"
                    size="xs"
                  >
                    Delete
                  </Button>
                </div>
              </form>
            ))}
          </div>
        </RetroPanel>
      )}
    </div>
  );
}
