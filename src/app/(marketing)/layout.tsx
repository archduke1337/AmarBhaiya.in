import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main id="main" className="retro-dot flex-1 bg-background">
        {children}
      </main>
      <Footer />
    </>
  );
}
