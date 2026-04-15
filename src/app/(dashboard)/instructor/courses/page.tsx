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
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        description={`${courses.length} total courses. Fix launch blockers, polish drafts, and keep every class ready before students see it.`}
        actions={
          <div className="flex w-full flex-col gap-2 min-[420px]:flex-row lg:w-auto">
            <Button asChild variant="outline" size="sm" className="w-full min-[420px]:w-auto">
              <Link href="/instructor/categories">
              Categories
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full min-[420px]:w-auto">
              <Link href="/instructor/courses/new">
                <Plus className="size-4" />
                New Course
              </Link>
            </Button>
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

      <RetroPanel tone="accent" className="text-sm font-semibold leading-7 text-muted-foreground">
        Before publishing, keep the course promise simple: clear thumbnail, one useful module, one real lesson, and at least one playable video. For paid courses, add a free preview so students can trust the teaching style before paying.
      </RetroPanel>

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
    <RetroPanel
      id={`course-${course.id}`}
      tone={course.status === "Published" ? "secondary" : "card"}
      className="group scroll-mt-24 transition-transform hover:-translate-y-1"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-black tracking-[-0.04em]">
                {course.title}
              </h2>
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
              <p className="line-clamp-2 max-w-3xl text-sm font-medium leading-7 text-muted-foreground">
                {course.shortDescription}
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Add a short promise for students: what will they understand better after this course?
              </p>
            )}

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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

          <div className="grid shrink-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:items-center">
            <Button asChild variant="outline" size="xs">
              <Link href={`/instructor/courses/${course.id}`}>
                Edit Details
              </Link>
            </Button>
            <Button asChild variant="secondary" size="xs">
              <Link href={`/instructor/courses/${course.id}/curriculum`}>
                Curriculum
                <ArrowRight className="size-3" />
              </Link>
            </Button>
            <form action={deleteCourseAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <Button
                type="submit"
                variant="destructive"
                size="xs"
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            </form>
          </div>
        </div>

        {course.publishBlockers.length > 0 ? (
          <div className="rounded-[calc(var(--radius)+2px)] border-2 border-destructive bg-destructive/10 px-4 py-3 shadow-retro-sm">
            <p className="font-heading text-xs font-black uppercase tracking-[0.14em] text-destructive">
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
          <div className="rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-muted)] px-4 py-3 shadow-retro-sm">
            <p className="font-heading text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
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
    </RetroPanel>
  );
}
