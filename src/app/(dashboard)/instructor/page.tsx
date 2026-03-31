export default function InstructorDashboardPage() {
  const kpis = [
    { label: "My courses", value: "4" },
    { label: "Active students", value: "186" },
    { label: "Live sessions", value: "2" },
    { label: "Pending reviews", value: "7" },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Instructor
        </p>
        <h1 className="text-3xl md:text-4xl">Instructor Command Center</h1>
        <p className="text-muted-foreground max-w-3xl">
          Manage courses, monitor learners, and run live sessions from one place.
        </p>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <article key={item.label} className="border border-border p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {item.label}
            </p>
            <p className="text-2xl">{item.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
