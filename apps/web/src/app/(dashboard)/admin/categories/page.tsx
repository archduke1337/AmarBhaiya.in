import { Folder, FolderPlus, Plus } from "lucide-react";

import {
  createCategoryFormAction,
  updateCategoryFormAction,
} from "@/server/actions/form-wrappers";
import { deleteCategoryFormAction } from "@/server/actions/form-wrappers";
import { getAdminCategories } from "@/server/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
      <section className="overflow-hidden rounded-2xl border border-border/40 bg-surface">
        <div className="flex items-center gap-2 border-b border-border/40 bg-surface-hover px-5 py-3.5">
          <FolderPlus className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-heading text-sm font-black uppercase tracking-[0.12em]">
              Create Category
            </h2>
            <p className="text-xs text-muted-foreground">
              Add a new course category like Maths, Science, or English.
            </p>
          </div>
        </div>
        <form action={createCategoryFormAction} className="flex flex-col gap-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                name="name"
                required
                minLength={2}
                placeholder="Career Growth"
              />
            </label>
            <label className="space-y-1.5">
              <Label htmlFor="cat-slug">Slug (optional)</Label>
              <Input
                id="cat-slug"
                name="slug"
                placeholder="career-growth"
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cat-desc">Description</Label>
              <textarea
                id="cat-desc"
                name="description"
                rows={2}
                placeholder="Used for upskilling and placement-focused programs."
                className="input-field--textarea w-full text-sm"
              />
            </label>
            <label className="space-y-1.5 md:max-w-[200px]">
              <Label htmlFor="cat-order">Display Order</Label>
              <Input
                id="cat-order"
                name="order"
                type="number"
                min={0}
                defaultValue={0}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm">
              <Plus className="size-3.5" />
              Create category
            </Button>
          </div>
        </form>
      </section>

      {/* Existing categories */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Category List
            </p>
            <h2 className="font-heading text-lg font-normal tracking-[-0.02em]">
              Existing Categories ({categories.length})
            </h2>
          </div>
          <Badge variant="outline">{categories.length} total</Badge>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No categories yet"
            description="Create your first category above to start organizing courses."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="overflow-hidden rounded-2xl border border-border/40 bg-surface"
              >
                <form action={updateCategoryFormAction} className="flex flex-col gap-4 p-5">
                  <input type="hidden" name="categoryId" value={category.id} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <Label htmlFor={`cat-name-${category.id}`}>Name</Label>
                      <Input
                        id={`cat-name-${category.id}`}
                        name="name"
                        required
                        minLength={2}
                        defaultValue={category.name}
                      />
                    </label>

                    <label className="space-y-1.5">
                      <Label htmlFor={`cat-slug-${category.id}`}>Slug</Label>
                      <Input
                        id={`cat-slug-${category.id}`}
                        name="slug"
                        defaultValue={category.slug}
                      />
                    </label>

                    <label className="space-y-1.5 md:col-span-2">
                      <Label htmlFor={`cat-desc-${category.id}`}>Description</Label>
                      <textarea
                        id={`cat-desc-${category.id}`}
                        name="description"
                        rows={2}
                        defaultValue={category.description}
                        className="input-field--textarea w-full text-sm"
                      />
                    </label>

                    <label className="space-y-1.5 md:max-w-[200px]">
                      <Label htmlFor={`cat-order-${category.id}`}>Order</Label>
                      <Input
                        id={`cat-order-${category.id}`}
                        name="order"
                        type="number"
                        min={0}
                        defaultValue={category.order}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button type="submit" size="sm">
                      Save changes
                    </Button>
                  </div>
                </form>

                {/* Delete form — must be sibling, not nested */}
                <form action={deleteCategoryFormAction} className="border-t border-border/40 px-5 py-3">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <Button type="submit" size="xs" variant="destructive">
                    Delete
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
