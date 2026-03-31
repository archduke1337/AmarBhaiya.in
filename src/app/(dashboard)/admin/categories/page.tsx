const CATEGORIES = ["tech", "academics", "fitness", "career", "business"];

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Categories</p>
        <h1 className="text-3xl mt-2">Category Management</h1>
      </div>

      <section className="border border-border p-6 space-y-3">
        {CATEGORIES.map((category) => (
          <div key={category} className="border border-border px-3 py-2 text-sm">
            {category}
          </div>
        ))}
      </section>
    </div>
  );
}
