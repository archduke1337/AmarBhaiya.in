type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCourseEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course Editor</p>
        <h1 className="text-3xl mt-2">Edit course: {id}</h1>
      </div>

      <section className="border border-border p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Update title, pricing, publish state, and summary metadata here.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Publish state</p>
            <p>Draft</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Access model</p>
            <p>Free</p>
          </div>
        </div>
      </section>
    </div>
  );
}
