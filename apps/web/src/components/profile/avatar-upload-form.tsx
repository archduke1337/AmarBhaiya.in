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

const AVATAR_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(0)} MB`;
}

export function AvatarUploadForm() {
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
        `Avatar upload is unavailable until ${missingEnvKeys.join(", ")} ${missingEnvKeys.length === 1 ? "is" : "are"} set in the deployment environment.`
      );
      return;
    }

    const file = inputRef.current?.files?.[0] ?? null;
    if (!file) {
      toast.error("Choose an avatar image first.");
      return;
    }

    const extension = getFileExtension(file.name);
    if (!AVATAR_ALLOWED_EXTENSIONS.includes(extension as (typeof AVATAR_ALLOWED_EXTENSIONS)[number])) {
      toast.error("Unsupported image format. Use JPG, PNG, or WEBP.");
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(`Avatar images must be ${formatBytes(AVATAR_MAX_BYTES)} or smaller.`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const tokenResponse = await fetch("/api/avatar/upload-token", {
        method: "POST",
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

      const completeResponse = await fetch("/api/avatar/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: uploaded.$id }),
      });

      const completePayload = (await completeResponse.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!completeResponse.ok || !completePayload?.success) {
        throw new Error(completePayload?.error || "Failed to attach uploaded avatar.");
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setProgress(100);
      toast.success("Avatar uploaded.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar."
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (!isDirectUploadConfigured) {
    return (
      <div className="space-y-1 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <p className="font-medium">Avatar upload is unavailable on this deployment.</p>
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
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".jpg,.jpeg,.png,.webp"
          disabled={isUploading}
          className="text-xs file:mr-2 file:h-8 file:border file:border-border file:bg-background file:px-3 file:text-xs disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isUploading}
          className="h-8 border border-border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload Avatar"}
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Direct Appwrite upload. Supports JPG, PNG, and WEBP up to {formatBytes(AVATAR_MAX_BYTES)}.
      </p>

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
