import { getAdminDashboardStats } from "@/lib/appwrite/dashboard-data";
import { formatCompactNumber, formatCurrency } from "@/lib/utils/format";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "Total users", value: formatCompactNumber(stats.totalUsers) },
    {
      label: "Active enrollments",
      value: formatCompactNumber(stats.activeEnrollments),
    },
    { label: "Monthly revenue", value: formatCurrency(stats.monthlyRevenue) },
    { label: "Live sessions", value: formatCompactNumber(stats.liveSessions) },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
        <h1 className="text-3xl md:text-4xl">Platform Control Center</h1>
      </section>

      <section className="grid md:grid-cols-4 gap-4">
        {cards.map((item) => (
          <article key={item.label} className="border border-border p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{item.label}</p>
            <p className="text-2xl">{item.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
