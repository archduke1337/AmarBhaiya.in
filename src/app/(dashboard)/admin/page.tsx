const KPI = [
  { label: "Total users", value: "2,640" },
  { label: "Active enrollments", value: "1,148" },
  { label: "Monthly revenue", value: "INR 3.8L" },
  { label: "Live sessions", value: "12" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
        <h1 className="text-3xl md:text-4xl">Platform Control Center</h1>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {KPI.map((item) => (
          <article key={item.label} className="border border-border p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{item.label}</p>
            <p className="text-2xl">{item.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
