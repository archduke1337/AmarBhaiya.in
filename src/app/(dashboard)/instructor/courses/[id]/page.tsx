import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Film, Layers, Users } from "lucide-react";

import { updateInstructorCourseAction } from "@/actions/operations";
import { DirectAppwriteUploadForm } from "@/components/instructor/direct-appwrite-upload-form";
import { PageHeader, StatCard, StatGrid } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorCourseSummary } from "@/lib/appwrite/dashboard-data";
import { formatCurrency, formatDuration } from "@/lib/utils/format";
import { formatLineSeparatedList } from "@/lib/utils/form-lists";

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
      <PageHeader
        eyebrow="Course Editor"
        title={`Edit course: ${course.title}`}
        description="Update metadata, check publish readiness, and keep the launch checklist moving."
        actions={
          <Link
            href={`/instructor/courses/${course.id}/curriculum`}
            className="text-sm underline underline-offset-4"
          >
            Manage curriculum
          </Link>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Modules"
          value={course.moduleCount}
          icon={Layers}
          description={`${course.totalLessons} lessons`}
        />
        <StatCard
          label="Lesson Videos"
          value={course.lessonVideoCount}
          icon={Film}
          description={
            course.missingVideoCount > 0
              ? `${course.missingVideoCount} still missing`
              : "All lessons have video"
          }
        />
        <StatCard
          label="Enrollments"
          value={course.activeEnrollments}
          icon={Users}
          description="Active learners"
        />
        <StatCard
          label="Publish State"
          value={course.isPublished ? "Live" : "Draft"}
          icon={CheckCircle2}
          description={
            course.readyToPublish
              ? "Ready to publish"
              : course.publishBlockers.length > 0
                ? `${course.publishBlockers.length} blocker${course.publishBlockers.length === 1 ? "" : "s"}`
                : "Needs a quick review"
          }
        />
      </StatGrid>

      <section
        id="publish-readiness"
        className="border border-border p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-xl">Publish Readiness</h2>
          <p className="text-sm text-muted-foreground">
            Publishing works best once the thumbnail, curriculum, and initial lesson media are in place.
          </p>
        </div>

        {course.publishBlockers.length === 0 && course.attentionFlags.length === 0 ? (
          <div className="border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            This course is in strong shape. You can publish it whenever you are ready.
          </div>
        ) : null}

        {course.publishBlockers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.15em] text-destructive">
              Blocking issues
            </p>
            <div className="flex flex-wrap gap-2">
              {course.publishBlockers.map((blocker) => (
                <Badge key={blocker} variant="destructive">
                  {blocker}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {course.attentionFlags.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Watch list
            </p>
            <div className="flex flex-wrap gap-2">
              {course.attentionFlags.map((flag) => (
                <Badge key={flag} variant="outline">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="border border-border p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl">Course metadata</h2>
          <Link
            href={`/instructor/courses/${course.id}/curriculum`}
            className="text-sm underline underline-offset-4"
          >
            Manage curriculum
          </Link>
        </div>

        <form action={updateInstructorCourseAction} className="grid gap-4">
          <input type="hidden" name="courseId" value={course.id} />

          <label className="space-y-1 text-sm">
            <span>Title</span>
            <input
              name="title"
              required
              minLength={6}
              defaultValue={course.title}
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Short description</span>
            <textarea
              name="shortDescription"
              required
              minLength={12}
              rows={4}
              defaultValue={course.shortDescription}
              className="w-full border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>What students will learn</span>
            <textarea
              name="whatYouLearn"
              rows={5}
              defaultValue={formatLineSeparatedList(course.whatYouLearn)}
              placeholder={"One learning outcome per line\nUnderstand core concepts\nSolve exam-style problems faster"}
              className="w-full border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Requirements</span>
            <textarea
              name="requirements"
              rows={5}
              defaultValue={formatLineSeparatedList(course.requirements)}
              placeholder={"One requirement per line\nBasic arithmetic\nNotebook and pen"}
              className="w-full border border-border bg-background px-3 py-2"
            />
          </label>

          <div className="grid md:grid-cols-3 gap-3">
            <label className="space-y-1 text-sm">
              <span>Access model</span>
              <select
                name="accessModel"
                defaultValue={course.accessModel}
                className="h-10 w-full border border-border bg-background px-3"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="subscription">Subscription</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span>Price (INR)</span>
              <input
                name="price"
                type="number"
                min={0}
                defaultValue={course.price}
                className="h-10 w-full border border-border bg-background px-3"
              />
            </label>

            <label className="space-y-1 text-sm flex items-end">
              <span className="inline-flex items-center gap-2 h-10 px-3 border border-border w-full">
                <input
                  type="checkbox"
                  name="isPublished"
                  defaultChecked={course.isPublished}
                />
                Published
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="h-10 px-4 bg-foreground text-background text-sm"
            >
              Save course details
            </button>
          </div>
        </form>
      </section>

      {/* Thumbnail upload */}
      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Course Thumbnail</h2>
        <p className="text-sm text-muted-foreground">
          Upload a cover image for this course. Recommended: 1280×720px, max 5MB.
          {course.thumbnailId
            ? " Current thumbnail: ✓ uploaded"
            : " No thumbnail uploaded yet."}
        </p>
        <DirectAppwriteUploadForm
          kind="course-thumbnail"
          courseId={course.id}
          accept=".jpg,.jpeg,.png,.webp"
          buttonLabel="Upload Thumbnail"
          successMessage="Course thumbnail uploaded."
          helperText="Direct Appwrite upload. Supports JPG, PNG, and WEBP up to 5 MB."
        />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current publish state</p>
          <p>{course.isPublished ? "Published" : "Draft"}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current access model</p>
          <p className="capitalize">{course.accessModel}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current price</p>
          <p>{course.price > 0 ? formatCurrency(course.price) : "Free"}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Lesson Stats</p>
          <p>
            {course.moduleCount} modules · {course.totalLessons} lessons · {formatDuration(course.totalDuration)}
          </p>
        </div>
      </section>
    </div>
  );
}
