import { notFound } from "next/navigation";
import { Award } from "lucide-react";

import { getCertificateById } from "@/actions/certificate";

type PageProps = {
  params: Promise<{ id: string }>;
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
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-20">
      <div className="w-full max-w-2xl border-2 border-foreground/10 p-12 text-center space-y-8">
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
          <span className="text-[10px] text-muted-foreground/40">✦</span>
          <div className="flex-1 border-t border-foreground/10" />
        </div>

        {/* Recipient */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">This certifies that</p>
          <p className="text-3xl font-medium">{cert.userName}</p>
        </div>

        {/* Course */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            has successfully completed
          </p>
          <p className="text-xl font-medium">{cert.courseTitle}</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-foreground/10" />
          <span className="text-[10px] text-muted-foreground/40">✦</span>
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
