import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";
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
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar role={role} userId={user.$id} />
      <div className="min-h-screen">
        <DashboardHeader userName={user.name} userEmail={user.email} role={role} />
        <main id="main" className="px-6 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
