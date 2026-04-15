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
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader
          userName={user.name}
          userEmail={user.email}
          role={role}
          userId={user.$id}
        />
        <main
          id="main"
          className="flex-1 px-4 py-5 md:px-6 md:py-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
