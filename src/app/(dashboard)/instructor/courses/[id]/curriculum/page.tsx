type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCurriculumPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Curriculum Builder</p>
        <h1 className="text-3xl mt-2">Curriculum for {id}</h1>
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Modules</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>- Module 1: Foundations</li>
            <li>- Module 2: Applied Practice</li>
            <li>- Module 3: Final Project</li>
          </ul>
        </article>

        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Builder Actions</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>- Add module</li>
            <li>- Add lesson</li>
            <li>- Reorder lessons</li>
            <li>- Attach resources and quiz</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
