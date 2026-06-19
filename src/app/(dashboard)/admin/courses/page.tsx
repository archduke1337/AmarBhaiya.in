import { BookOpen, Eye, Star, Layers } from "lucide-react";

import { updateCourseVisibilityFormAction, deleteCourseFormAction } from "@/actions/form-wrappers";
import { getAdminCourses } from "@/lib/appwrite/dashboard-data";
import { PageHeader, StatGrid, StatCard, EmptyState } from "@/components/dashboard";
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{courses.length} total</Badge>
            <Badge variant="outline">{published} published</Badge>
            <Badge variant="outline">{drafts} drafts</Badge>
            <Badge variant="outline">{featured} featured</Badge>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
            {/* Table header */}
            <div className="hidden items-center gap-4 border-b border-border/40 bg-surface-hover px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_120px_80px_80px_120px]">
              <span>Course</span>
              <span>Category</span>
              <span>Published</span>
              <span>Featured</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-border/40">
              {courses.map((course) => (
                <form
                  key={course.id}
                  action={updateCourseVisibilityFormAction}
                  className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1fr_120px_80px_80px_120px] md:items-center md:gap-4"
                >
                  <input type="hidden" name="courseId" value={course.id} />

                  <div>
                    <h3 className="text-sm font-semibold">{course.title}</h3>
                  </div>

                  <Badge variant="outline" className="w-fit text-xs">
                    {course.category}
                  </Badge>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isPublished"
                      defaultChecked={course.state === "published"}
                      className="size-4 accent-foreground"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {course.state === "published" ? "Yes" : "No"}
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      defaultChecked={course.featured === "yes"}
                      className="size-4 accent-foreground"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {course.featured === "yes" ? "Yes" : "No"}
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Button type="submit" variant="secondary" size="xs">
                      Save
                    </Button>
                    <Button
                      type="submit"
                      formAction={deleteCourseFormAction}
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
          </div>

          <div className="rounded-xl border border-border/40 bg-surface-hover px-5 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground">
              ⚡ The homepage hero section picks the top 3 featured courses by enrollment count. Unfeature a course or feature a new one and the hero updates after revalidation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
