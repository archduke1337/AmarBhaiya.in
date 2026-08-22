"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { incrementResourceDownloadAction } from "@/server/actions/standalone-resources";

type NoteDownloadButtonProps = {
  resourceId: string;
  label?: string;
  className?: string;
};

export function NoteDownloadButton({
  resourceId,
  label = "Download",
  className,
}: NoteDownloadButtonProps) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setStarting(true);
    setError("");
    const fd = new FormData();
    fd.set("resourceId", resourceId);
    try {
      const res = await incrementResourceDownloadAction(fd) as { success?: boolean; error?: string };
      if (res && res.success === false) {
        setError(res.error || "Download failed");
      }
    } catch {
      setError("Download failed");
    } finally {
      setStarting(false);
    }
    const win = window.open(`/api/standalone-resource/${resourceId}?download=1`, "_blank", "noreferrer");
    if (!win) {
      setError("Popup blocked — please allow popups to download.");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        disabled={starting}
        onClick={handleDownload}
        className={className}
        aria-live="polite"
      >
        <Download className="size-4" aria-hidden />
        {starting ? "Starting…" : label}
      </Button>
      {error && (
        <p role="alert" aria-live="assertive" className="text-[11px] font-medium text-destructive px-1">
          {error}
        </p>
      )}
    </div>
  );
}