import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { requireAuth } from "@/server/appwrite/auth";
import { getUserRole } from "@/server/appwrite/auth-utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const role = getUserRole(user);

  return (
    <div className="min-h-dvh bg-background md:grid md:grid-cols-[88px_1fr] xl:grid-cols-[240px_1fr] antialiased">
      <Sidebar role={role} userId={user.$id} />
      
      <div className="flex flex-col min-h-dvh bg-background pb-tab">
        <DashboardHeader userName={user.name} userEmail={user.email} role={role} userId={user.$id} />
        
        <main
          id="main"
          className="flex-1 px-4 py-5 md:px-6 md:py-8 lg:px-8 w-full max-w-[1400px] mx-auto"
        >
          <div className="flex flex-col gap-6">
            {children}
          </div>
        </main>
        
        <BottomTabBar role={role} userId={user.$id} />
      </div>
    </div>
  );
}
