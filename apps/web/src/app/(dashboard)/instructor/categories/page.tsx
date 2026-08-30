import { PageHeader } from "@/components/dashboard";
import {
  createCategoryFormAction,
  updateCategoryFormAction,
} from "@/server/actions/form-wrappers";
import { requireRole } from "@/server/appwrite/auth";
import { getAdminCategories } from "@/server/appwrite/dashboard-data";

export default async function InstructorCategoriesPage() {
  await requireRole(["admin", "instructor"]);
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        eyebrow="Instructor Categories"
        title="Category Setup for Course Publishing"
      />

      <section className="bg-surface border border-border/40 rounded-2xl p-6 space-y-4">
        <h2 className="font-heading text-xl font-normal tracking-[-0.02em]">Add a category</h2>
        <p className="text-sm text-muted-foreground">
          Create and refine categories here so your courses are mapped correctly in discovery.
        </p>

        <form action={createCategoryFormAction} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Name</span>
            <input
              name="name"
              required
              minLength={2}
              placeholder="Placement Preparation"
              className="input-field h-10 w-full"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span>Slug (optional)</span>
            <input
              name="slug"
              placeholder="placement-preparation"
              className="input-field h-10 w-full"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span>Description</span>
            <textarea
              name="description"
              rows={3}
              className="input-field--textarea w-full"
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
              className="input-field h-10 w-full"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] bg-foreground px-6 text-sm font-bold text-background shadow-retro-sm transition-all hover:-translate-y-px hover:translate-x-px hover:shadow-none"
            >
              Create category
            </button>
          </div>
        </form>
      </section>

      <section className="bg-surface border border-border/40 rounded-2xl p-6 space-y-4">
        <h2 className="font-heading text-xl font-normal tracking-[-0.02em]">Edit categories</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories found yet.</p>
        ) : null}

        {categories.map((category) => (
          <article key={category.id} className="bg-surface border border-border/40 rounded-xl p-4">
            <form action={updateCategoryFormAction} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="categoryId" value={category.id} />

              <label className="space-y-1 text-sm">
                <span>Name</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  defaultValue={category.name}
                  className="input-field h-10 w-full"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span>Slug</span>
                <input
                  name="slug"
                  defaultValue={category.slug}
                  className="input-field h-10 w-full"
                />
              </label>

              <label className="space-y-1 text-sm md:col-span-2">
                <span>Description</span>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={category.description}
                  className="input-field--textarea w-full"
                />
              </label>

              <label className="space-y-1 text-sm md:max-w-xs">
                <span>Order</span>
                <input
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={category.order}
                  className="input-field h-10 w-full"
                />
              </label>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-[calc(var(--radius)+2px)] border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-hover"
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
