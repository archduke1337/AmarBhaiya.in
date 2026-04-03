import { createCourseDraftAction } from "@/actions/dashboard";
import { requireRole } from "@/lib/appwrite/auth";
import { getAdminCategories } from "@/lib/appwrite/dashboard-data";

export default async function InstructorNewCoursePage() {
  await requireRole(["admin", "instructor"]);
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Create Course</p>
        <h1 className="text-3xl mt-2">Course Creation Wizard</h1>
      </div>

      <form action={createCourseDraftAction} className="border border-border p-6 space-y-4">
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Course title</span>
          <input
            name="title"
            className="w-full h-11 border border-border bg-background px-3"
            placeholder="Enter course title"
            required
            minLength={6}
          />
        </label>
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Category</span>
          <select
            name="categoryId"
            className="w-full h-11 border border-border bg-background px-3"
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
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Access model</span>
          <select
            name="accessModel"
            className="w-full h-11 border border-border bg-background px-3"
            defaultValue="free"
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="subscription">Subscription</option>
          </select>
        </label>
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Short description</span>
          <textarea
            name="shortDescription"
            className="w-full min-h-28 border border-border bg-background px-3 py-2"
            placeholder="What outcomes will students get?"
            required
            minLength={12}
          />
        </label>
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">What students will learn</span>
          <textarea
            name="whatYouLearn"
            className="w-full min-h-28 border border-border bg-background px-3 py-2"
            placeholder={"One outcome per line\nMaster real numbers\nBuild strong algebra fundamentals"}
          />
        </label>
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Requirements</span>
          <textarea
            name="requirements"
            className="w-full min-h-28 border border-border bg-background px-3 py-2"
            placeholder={"One requirement per line\nBasic Class 9 maths\nNotebook for practice"}
          />
        </label>
        <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">Save draft</button>
      </form>
    </div>
  );
}
