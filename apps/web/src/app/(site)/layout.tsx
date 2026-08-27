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
      {/* Skip link — lets keyboard / screen-reader users jump past the fixed nav */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full focus:bg-accent focus:px-4 focus:text-sm focus:font-bold focus:text-accent-foreground focus:shadow-surface"
      >
        Skip to content
      </a>
      <Navbar initialAuthenticated={!!user} />
      {/* Spacer for fixed island navbar (4.5rem nav + safe area) */}
      <div className="h-[calc(4.5rem+var(--safe-top)+0.75rem)] sm:h-[calc(5rem+var(--safe-top))]" aria-hidden="true" />
      
      <main id="main" className="flex-1 scroll-mt-40">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
