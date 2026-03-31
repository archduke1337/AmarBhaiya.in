export default function ModeratorDashboardPage() {
  const cards = [
    { label: "Open reports", value: "13" },
    { label: "Muted users", value: "4" },
    { label: "Flagged threads", value: "9" },
    { label: "Actions today", value: "21" },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Moderator</p>
        <h1 className="text-3xl md:text-4xl">Moderation Dashboard</h1>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <article key={card.label} className="border border-border p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{card.label}</p>
            <p className="text-2xl">{card.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
