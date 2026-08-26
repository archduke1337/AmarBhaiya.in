import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award } from "lucide-react";

import { getCertificateById } from "@/server/actions/certificate";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Certificate Verification — AmarBhaiya.in",
  description:
    "Verify an AmarBhaiya.in certificate of completion.",
  robots: { index: false, follow: false },
};

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params;
  const cert = await getCertificateById(id);

  if (!cert) {
    notFound();
  }

  const date = new Date(cert.issuedAt);
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
      <h1 className="sr-only">
        Certificate Verification — {cert.userName} — {cert.courseTitle}
      </h1>
      <div className="w-full max-w-2xl space-y-8 rounded-3xl border-2 border-foreground/10 bg-surface/60 p-6 text-center shadow-[var(--surface-shadow)] sm:p-10 md:p-12">
        {/* Header ornament */}
        <div className="flex justify-center">
          <Award className="size-12 text-foreground/20" />
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Certificate of Completion
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            AmarBhaiya.in
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-foreground/10" />
          <span className="w-1 h-1 rounded-full bg-foreground/20" />
          <div className="flex-1 border-t border-foreground/10" />
        </div>

        {/* Recipient */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">This certifies that</p>
          <p className="break-words font-heading text-[clamp(1.75rem,5vw,2.5rem)] font-bold tracking-[-0.04em]">{cert.userName}</p>
        </div>

        {/* Course */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            has successfully completed
          </p>
          <p className="break-words text-lg font-semibold leading-7">{cert.courseTitle}</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-foreground/10" />
          <span className="w-1 h-1 rounded-full bg-foreground/20" />
          <div className="flex-1 border-t border-foreground/10" />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Issued on</p>
          <p className="text-sm font-medium">{formattedDate}</p>
        </div>

        {/* Verification */}
        <p className="text-[10px] text-muted-foreground/50">
          Certificate ID: {id}
        </p>
      </div>
    </div>
  );
}
