import {
  createCategoryAction,
  updateCategoryAction,
} from "@/actions/operations";
import { requireRole } from "@/lib/appwrite/auth";
import { getAdminCategories } from "@/lib/appwrite/dashboard-data";

export default async function InstructorCategoriesPage() {
  await requireRole(["admin", "instructor"]);
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Instructor Categories
        </p>
        <h1 className="text-3xl mt-2">Category Setup for Course Publishing</h1>
      </div>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Add a category</h2>
        <p className="text-sm text-muted-foreground">
          Create and refine categories here so your courses are mapped correctly in discovery.
        </p>

        <form action={createCategoryAction} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Name</span>
            <input
              name="name"
              required
              minLength={2}
              placeholder="Placement Preparation"
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Slug (optional)</span>
            <input
              name="slug"
              placeholder="placement-preparation"
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span>Description</span>
            <textarea
              name="description"
              rows={3}
              className="w-full border border-border bg-background px-3 py-2"
              placeholder="Focused interview and hiring-readiness content."
            />
          </label>

          <label className="space-y-1 text-sm md:max-w-xs">
            <span>Order</span>
            <input
              name="order"
              type="number"
              min={0}
              defaultValue={0}
              className="h-10 w-full border border-border bg-background px-3"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="h-10 px-4 bg-foreground text-background text-sm"
            >
              Create category
            </button>
          </div>
        </form>
      </section>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Edit categories</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories found yet.</p>
        ) : null}

        {categories.map((category) => (
          <article key={category.id} className="border border-border p-4">
            <form action={updateCategoryAction} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="categoryId" value={category.id} />

              <label className="space-y-1 text-sm">
                <span>Name</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  defaultValue={category.name}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span>Slug</span>
                <input
                  name="slug"
                  defaultValue={category.slug}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={category.description}
                  className="w-full border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm md:max-w-xs">
                <span>Order</span>
                <input
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={category.order}
                  className="h-10 w-full border border-border bg-background px-3"
                />
              </label>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="h-10 px-4 border border-border text-sm hover:bg-muted"
                >
                  Update category
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
