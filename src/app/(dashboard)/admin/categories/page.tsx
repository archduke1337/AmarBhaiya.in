import { getAdminCategories } from "@/lib/appwrite/dashboard-data";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Categories</p>
        <h1 className="text-3xl mt-2">Category Management</h1>
      </div>

      <section className="border border-border p-6 space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories found.</p>
        ) : null}

        {categories.map((category) => (
          <article key={category.id} className="border border-border px-3 py-2 text-sm">
            <p>{category.name}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
              slug: {category.slug || "n/a"} · order: {category.order}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
