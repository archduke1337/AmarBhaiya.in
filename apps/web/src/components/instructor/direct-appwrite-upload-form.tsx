"use client";

import { startTransition, useRef, useState } from "react";
import { Client, ID, Storage } from "appwrite";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  PUBLIC_APPWRITE_CONFIG,
  getMissingPublicAppwriteEnvKeys,
  hasPublicAppwriteConfig,
} from "@/lib/appwrite/public-config";
import {
  type InstructorUploadKind,
  getInstructorUploadMaxBytes,
  getUploadFileExtension,
  isAllowedInstructorUploadExtension,
} from "@/lib/uploads/instructor-file";

type DirectAppwriteUploadFormProps = {
  kind: InstructorUploadKind;
  courseId?: string;
  resourceId?: string;
  accept: string;
  buttonLabel: string;
  successMessage: string;
  helperText?: string;
  statusLabel?: string;
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  }

  return `${(bytes / 1_000_000).toFixed(0)} MB`;
}

export function DirectAppwriteUploadForm({
  kind,
  courseId,
  resourceId,
  accept,
  buttonLabel,
  successMessage,
  helperText,
  statusLabel,
}: DirectAppwriteUploadFormProps) {
  const missingEnvKeys = getMissingPublicAppwriteEnvKeys();
  const isDirectUploadConfigured = hasPublicAppwriteConfig();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDirectUploadConfigured) {
      toast.error(
        `Upload is unavailable until ${missingEnvKeys.join(", ")} ${missingEnvKeys.length === 1 ? "is" : "are"} set in the deployment environment.`
      );
      return;
    }

    const file = inputRef.current?.files?.[0] ?? null;
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }

    const extension = getUploadFileExtension(file.name);
    if (!isAllowedInstructorUploadExtension(kind, extension)) {
      toast.error(`Unsupported file format for this upload.`);
      return;
    }

    const maxBytes = getInstructorUploadMaxBytes(kind);
    if (file.size > maxBytes) {
      toast.error(`Files must be ${formatBytes(maxBytes)} or smaller.`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const tokenResponse = await fetch("/api/instructor/uploads/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          ...(courseId ? { courseId } : {}),
          ...(resourceId ? { resourceId } : {}),
        }),
      });

      const tokenPayload = (await tokenResponse.json().catch(() => null)) as
        | { jwt?: string; bucketId?: string; error?: string }
        | null;

      if (!tokenResponse.ok || !tokenPayload?.jwt || !tokenPayload.bucketId) {
        throw new Error(tokenPayload?.error || "Failed to create upload session.");
      }

      const client = new Client()
        .setEndpoint(PUBLIC_APPWRITE_CONFIG.endpoint)
        .setProject(PUBLIC_APPWRITE_CONFIG.projectId)
        .setJWT(tokenPayload.jwt);
      const storage = new Storage(client);

      const uploaded = await storage.createFile({
        bucketId: tokenPayload.bucketId,
        fileId: ID.unique(),
        file,
        onProgress: (snapshot) => {
          setProgress(snapshot.progress);
        },
      });

      const completeResponse = await fetch("/api/instructor/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          fileId: uploaded.$id,
          ...(courseId ? { courseId } : {}),
          ...(resourceId ? { resourceId } : {}),
        }),
      });

      const completePayload = (await completeResponse.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!completeResponse.ok || !completePayload?.success) {
        throw new Error(completePayload?.error || "Failed to attach uploaded file.");
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setProgress(100);
      toast.success(successMessage);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file."
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (!isDirectUploadConfigured) {
    return (
      <div className="space-y-1 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <p className="font-medium">Direct upload is unavailable on this deployment.</p>
        <p>
          Missing public Appwrite environment {missingEnvKeys.length === 1 ? "variable" : "variables"}:{" "}
          {missingEnvKeys.join(", ")}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {statusLabel ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {statusLabel}
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept={accept}
          disabled={isUploading}
          className="flex-1 text-xs file:mr-2 file:h-8 file:border file:border-border file:bg-background file:px-3 file:text-xs disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isUploading}
          className="h-8 shrink-0 border border-border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : buttonLabel}
        </button>
      </div>

      {helperText ? (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      ) : null}

      {isUploading ? (
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-foreground transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{progress}% uploaded</p>
        </div>
      ) : null}
    </form>
  );
}
