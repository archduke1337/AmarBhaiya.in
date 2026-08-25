import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getLoggedInUser } from "@/server/appwrite/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getLoggedInUser().catch(() => null);
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Navbar initialAuthenticated={!!user} />
      {/* Spacer for fixed island navbar (4.5rem nav + safe area) */}
      <div className="h-[calc(4.5rem+var(--safe-top)+0.75rem)] sm:h-[calc(5rem+var(--safe-top))]" aria-hidden="true" />
      
      <main id="main" className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
