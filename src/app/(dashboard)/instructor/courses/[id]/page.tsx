import Link from "next/link";
import { notFound } from "next/navigation";

import { updateInstructorCourseAction } from "@/actions/operations";
import { uploadCourseThumbnailAction } from "@/actions/upload";
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
        <form
          action={uploadCourseThumbnailAction}
          encType="multipart/form-data"
          className="flex items-center gap-3"
        >
          <input type="hidden" name="courseId" value={course.id} />
          <input
            type="file"
            name="file"
            accept=".jpg,.jpeg,.png,.webp"
            required
            className="text-sm file:mr-2 file:h-9 file:border file:border-border file:bg-background file:px-4 file:text-sm"
          />
          <button
            type="submit"
            className="h-9 shrink-0 border border-border px-4 text-sm hover:bg-muted transition-colors"
          >
            Upload Thumbnail
          </button>
        </form>
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
            {course.totalLessons} lessons · {formatDuration(course.totalDuration)}
          </p>
        </div>
      </section>
    </div>
  );
}
