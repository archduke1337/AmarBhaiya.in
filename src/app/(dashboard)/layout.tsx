import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";
import { StudentBottomTabBar } from "@/components/layout/student-bottom-tab-bar";
import { requireAuth } from "@/lib/appwrite/auth";
import { getUserRole } from "@/lib/appwrite/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const role = getUserRole(user);

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[88px_1fr] xl:grid-cols-[240px_1fr]">
      <Sidebar role={role} userId={user.$id} />
      <div className={`min-h-screen bg-background ${role === "student" ? "pb-24 md:pb-0" : ""}`}>
        <DashboardHeader userName={user.name} userEmail={user.email} role={role} userId={user.$id} />
        <main
          id="main"
          className={`px-4 py-5 md:px-6 md:py-8 lg:px-8 ${role === "student" ? "pb-28 md:pb-8" : ""}`}
        >
          <div className="retro-grid">
            {children}
          </div>
        </main>
        {role === "student" ? <StudentBottomTabBar userId={user.$id} /> : null}
      </div>
    </div>
  );
}
