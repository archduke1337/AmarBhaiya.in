"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { incrementResourceDownloadAction } from "@/server/actions/standalone-resources";

type NoteDownloadButtonProps = {
  resourceId: string;
  downloadUrl: string;
  label?: string;
  className?: string;
};

export function NoteDownloadButton({
  resourceId,
  downloadUrl,
  label = "Download",
  className,
}: NoteDownloadButtonProps) {
  const [starting, setStarting] = useState(false);

  const handleDownload = async () => {
    setStarting(true);
    const fd = new FormData();
    fd.set("resourceId", resourceId);
    incrementResourceDownloadAction(fd).finally(() => setStarting(false));
    window.open(downloadUrl, "_blank", "noreferrer");
  };

  return (
    <Button
      type="button"
      size="sm"
      disabled={starting}
      onClick={handleDownload}
      className={className}
    >
      <Download className="size-4" aria-hidden />
      {starting ? "Starting…" : label}
    </Button>
  );
}