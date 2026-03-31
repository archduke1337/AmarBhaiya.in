import { requireRole } from "@/lib/appwrite/auth";
import { getInstructorDashboardStats } from "@/lib/appwrite/dashboard-data";
import { formatCompactNumber } from "@/lib/utils/format";

export default async function InstructorDashboardPage() {
  const { user, role } = await requireRole(["admin", "instructor"]);
  const stats = await getInstructorDashboardStats({ userId: user.$id, role });

  const cards = [
    { label: "Courses", value: formatCompactNumber(stats.courses) },
    {
      label: "Active enrollments",
      value: formatCompactNumber(stats.activeEnrollments),
    },
    { label: "Live sessions", value: formatCompactNumber(stats.liveSessions) },
    {
      label: "Pending reviews",
      value: formatCompactNumber(stats.pendingReviews),
    },
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
        {cards.map((item) => (
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
