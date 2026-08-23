import { createCourseDraftFormAction } from "@/server/actions/form-wrappers";
import { requireRole } from "@/server/appwrite/auth";
import { getAdminCategories } from "@/server/appwrite/dashboard-data";

export default async function InstructorNewCoursePage() {
  await requireRole(["admin", "instructor"]);
  const categories = await getAdminCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Instructor · Create Course
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-[-0.05em]">
          Course Creation Wizard
        </h1>
        <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">
          Fill in the essentials below to create a draft. You can refine everything later in the course editor.
        </p>
      </div>

      <form
        action={createCourseDraftFormAction}
        className="overflow-hidden rounded-2xl border border-border/40 bg-surface"
      >
        <div className="border-b border-border/40 bg-surface-hover px-5 py-4">
          <h2 className="font-heading text-base font-black tracking-[-0.03em]">
            Course Details
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            A clear title and description help students find and trust your course.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">Course title</span>
            <input
              name="title"
              className="input-field w-full"
              placeholder="Enter course title"
              required
              minLength={6}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">Category</span>
              <select
                name="categoryId"
                className="input-field--select w-full"
                defaultValue=""
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-foreground">Access model</span>
              <select
                name="accessModel"
                className="input-field--select w-full"
                defaultValue="free"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="subscription">Subscription</option>
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">Short description</span>
            <textarea
              name="shortDescription"
              className="input-field--textarea w-full min-h-28"
              placeholder="What outcomes will students get?"
              required
              minLength={12}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">What students will learn</span>
            <textarea
              name="whatYouLearn"
              className="input-field--textarea w-full min-h-28"
              placeholder={"One outcome per line\nMaster real numbers\nBuild strong algebra fundamentals"}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">Requirements</span>
            <textarea
              name="requirements"
              className="input-field--textarea w-full min-h-28"
              placeholder={"One requirement per line\nBasic Class 9 maths\nNotebook for practice"}
            />
          </label>
        </div>

        <div className="flex justify-end border-t border-border/40 bg-surface-hover px-5 py-4">
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-[calc(var(--radius)+2px)] bg-foreground px-6 text-sm font-bold text-background shadow-retro-sm transition-all hover:-translate-y-px hover:translate-x-px hover:shadow-none"
          >
            Save draft
          </button>
        </div>
      </form>
    </div>
  );
}
