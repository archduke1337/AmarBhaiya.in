import { Folder, Plus } from "lucide-react";

import {
  createCategoryAction,
  updateCategoryAction,
} from "@/actions/operations";
import { deleteCategoryAction } from "@/actions/delete";
import { getAdminCategories } from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <PageHeader
        eyebrow="Admin · Categories"
        title="Category Management"
        description={`${categories.length} categories define how courses are organized across the platform.`}
      />

      {/* Create category form */}
      <section className="border border-border">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Plus className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Create Category</h2>
        </div>
        <form action={createCategoryAction} className="grid gap-4 p-5 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Name</span>
            <input
              name="name"
              required
              minLength={2}
              placeholder="Career Growth"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Slug (optional)</span>
            <input
              name="slug"
              placeholder="career-growth"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Description</span>
            <textarea
              name="description"
              rows={2}
              placeholder="Used for upskilling and placement-focused programs."
              className="border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm md:max-w-[200px]">
            <span className="text-muted-foreground">Display Order</span>
            <input
              name="order"
              type="number"
              min={0}
              defaultValue={0}
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>
          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              className="h-10 bg-foreground px-4 text-sm text-background transition-opacity hover:opacity-90"
            >
              Create category
            </button>
          </div>
        </form>
      </section>

      {/* Existing categories */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">
          Existing Categories ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No categories yet"
            description="Create your first category above to start organizing courses."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <article key={category.id} className="border border-border">
                <form action={updateCategoryAction} className="grid gap-4 p-5 md:grid-cols-2">
                  <input type="hidden" name="categoryId" value={category.id} />

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <input
                      name="name"
                      required
                      minLength={2}
                      defaultValue={category.name}
                      className="h-10 border border-border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Slug</span>
                    <input
                      name="slug"
                      defaultValue={category.slug}
                      className="h-10 border border-border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
                    <span className="text-muted-foreground">Description</span>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={category.description}
                      className="border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm md:max-w-[200px]">
                    <span className="text-muted-foreground">Order</span>
                    <input
                      name="order"
                      type="number"
                      min={0}
                      defaultValue={category.order}
                      className="h-10 border border-border bg-background px-3 text-sm"
                    />
                  </label>

                  <div className="flex items-end justify-end md:col-span-2">
                    <button
                      type="submit"
                      className="h-9 border border-border px-4 text-sm transition-colors hover:bg-muted"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
                <div className="flex items-center px-5 pb-4">
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button
                      type="submit"
                      className="h-9 border border-destructive/30 px-4 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
