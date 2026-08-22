import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Navbar />
      {/* Spacer for fixed island navbar (4.5rem nav + safe area) */}
      <div className="h-[calc(4.5rem+var(--safe-top)+0.75rem)] sm:h-[calc(5rem+var(--safe-top))]" aria-hidden />
      
      <main id="main" className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
