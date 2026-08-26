import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { SectionHeading } from "@/components/marketing/section-heading";

type CertificatesPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export const metadata: Metadata = {
  title: "Certificate Verification",
  description:
    "Verify certificate authenticity by entering a certificate ID from amarbhaiya.in.",
  alternates: { canonical: "/certificates" },
};

export default async function CertificatesPage({ searchParams }: CertificatesPageProps) {
  const { id } = await searchParams;
  const certificateId = typeof id === "string" ? id.trim() : "";

  if (certificateId) {
    redirect(`/certificates/${encodeURIComponent(certificateId)}`);
  }

  return (
    <div className="site-container space-y-12 py-12 sm:py-16 xl:space-y-16 xl:py-20">
      <section className="mx-auto max-w-5xl space-y-6">
        <SectionHeading
          eyebrow="Verification"
          title="Check a certificate"
          description="Enter a certificate ID to verify its authenticity and view issued learner details."
          titleAs="h1"
          align="center"
        />

        <RetroPanel tone="secondary" size="lg" className="space-y-5">
          <form method="get" className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label htmlFor="certificate-id" className="site-kicker font-sans">
                Certificate ID
              </label>
              <input
                id="certificate-id"
                name="id"
                required
                placeholder="Paste certificate ID"
                className="h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-[color:var(--surface-card)] px-3 text-sm font-medium text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </div>
            <Button type="submit" size="lg" className="font-bold">
              Verify certificate
            </Button>
          </form>

          <p className="text-sm font-medium leading-7 text-foreground/80">
            If a certificate cannot be found, check the ID for typos or ask the learner to share the exact verification link.
          </p>
        </RetroPanel>
      </section>
    </div>
  );
}
