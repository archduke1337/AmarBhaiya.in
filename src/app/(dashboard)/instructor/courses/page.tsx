import Link from "next/link";
import { ArrowRight, Layers, Plus } from "lucide-react";

import { deleteCourseAction } from "@/actions/delete";
import {
  ActivityFeed,
  EmptyState,
  PageHeader,
  StatCard,
  StatGrid,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/appwrite/auth";
import {
  getInstructorCourseList,
  type InstructorCourseListItem,
} from "@/lib/appwrite/dashboard-data";
import { formatCurrency, formatDuration } from "@/lib/utils/format";

export default async function InstructorCoursesPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const courses = await getInstructorCourseList({ userId: user.$id, role });

  const published = courses.filter((course) => course.status === "Published");
  const drafts = courses.filter((course) => course.status === "Draft");
  const readyToPublish = courses.filter((course) => course.readyToPublish);
  const needsSetup = courses.filter((course) => course.publishBlockers.length > 0);
  const watchlist = courses.filter(
    (course) =>
      course.publishBlockers.length === 0 && course.attentionFlags.length > 0
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Instructor · Courses"
        title="Your Course Library"
        description={`${courses.length} total courses. Review launch blockers, draft readiness, and curriculum health from one place.`}
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

      <StatGrid columns={4}>
        <StatCard
          label="Published"
          value={published.length}
          description="Live in the catalogue"
        />
        <StatCard
          label="Drafts"
          value={drafts.length}
          description="Still being prepared"
        />
        <StatCard
          label="Ready To Publish"
          value={readyToPublish.length}
          description="Drafts with no launch blockers"
        />
        <StatCard
          label="Needs Setup"
          value={needsSetup.length + watchlist.length}
          description="Blocking or warning signals"
        />
      </StatGrid>

      <section className="border border-border bg-muted/30 px-5 py-3 text-sm text-muted-foreground">
        Strong launch baseline: thumbnail uploaded, at least one module, at least one lesson, and at least one lesson video. Paid and subscription courses also benefit from a free preview lesson.
      </section>

      {courses.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No courses yet"
          description="Create your first course to start building your teaching portfolio."
          action={{ label: "Create course", href: "/instructor/courses/new" }}
        />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <ActivityFeed
              title={`Ready To Publish (${readyToPublish.length})`}
              emptyText="No draft courses are fully ready to publish yet."
              items={readyToPublish.slice(0, 6).map((course) => ({
                id: course.id,
                label: course.title,
                description: `${course.moduleCount} modules · ${course.totalLessons} lessons · ${course.lessonVideoCount} videos`,
                badge: "Ready",
                href: `/instructor/courses#course-${course.id}`,
              }))}
            />

            <ActivityFeed
              title={`Needs Setup (${needsSetup.length + watchlist.length})`}
              emptyText="No blocking course issues right now."
              items={[...needsSetup, ...watchlist].slice(0, 6).map((course) => ({
                id: `needs-${course.id}`,
                label: course.title,
                description:
                  course.publishBlockers[0] ??
                  course.attentionFlags[0] ??
                  "Needs a quick review",
                badge: course.publishBlockers.length > 0 ? "Blocked" : "Watch",
                href: `/instructor/courses#course-${course.id}`,
              }))}
            />
          </section>

          <section className="flex flex-col gap-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: InstructorCourseListItem }) {
  return (
    <article
      id={`course-${course.id}`}
      className="group scroll-mt-24 border border-border transition-colors hover:border-foreground/20"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-medium">{course.title}</h2>
              <Badge variant={course.status === "Published" ? "default" : "outline"}>
                {course.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {course.accessModel}
              </Badge>
              {course.accessModel !== "free" ? (
                <Badge variant="secondary">{formatCurrency(course.price)}</Badge>
              ) : null}
            </div>

            {course.shortDescription ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {course.shortDescription}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No description yet
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {course.moduleCount} module{course.moduleCount === 1 ? "" : "s"} ·{" "}
              {course.totalLessons} lesson{course.totalLessons === 1 ? "" : "s"} ·{" "}
              {formatDuration(course.totalDuration)} · {course.activeEnrollments} enrollment
              {course.activeEnrollments === 1 ? "" : "s"}
            </p>

            <div className="flex flex-wrap gap-2">
              {course.hasThumbnail ? (
                <Badge variant="secondary">Thumbnail ready</Badge>
              ) : (
                <Badge variant="destructive">Thumbnail missing</Badge>
              )}
              {course.previewLessonCount > 0 ? (
                <Badge variant="outline">
                  {course.previewLessonCount} preview lesson
                  {course.previewLessonCount === 1 ? "" : "s"}
                </Badge>
              ) : null}
              {course.missingVideoCount > 0 ? (
                <Badge variant={course.lessonVideoCount === 0 ? "destructive" : "outline"}>
                  {course.missingVideoCount} lesson video
                  {course.missingVideoCount === 1 ? "" : "s"} missing
                </Badge>
              ) : course.totalLessons > 0 ? (
                <Badge variant="secondary">All lesson videos uploaded</Badge>
              ) : null}
              {course.readyToPublish ? (
                <Badge>Ready to publish</Badge>
              ) : null}
            </div>
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
            <form action={deleteCourseAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                className="inline-flex h-8 items-center border border-destructive/30 px-3 text-xs text-destructive transition-colors hover:bg-destructive/10"
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        {course.publishBlockers.length > 0 ? (
          <div className="border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-destructive">
              Publish blockers
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {course.publishBlockers.map((blocker) => (
                <Badge key={blocker} variant="destructive">
                  {blocker}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {course.attentionFlags.length > 0 ? (
          <div className="border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Watch list
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {course.attentionFlags.map((flag) => (
                <Badge key={flag} variant="outline">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
