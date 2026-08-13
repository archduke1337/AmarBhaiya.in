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
      {/* Spacer for fixed navbar */}
      <div className="h-20" aria-hidden />
      
      <main id="main" className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
