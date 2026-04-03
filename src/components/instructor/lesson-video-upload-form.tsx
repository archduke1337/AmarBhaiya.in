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
  LESSON_VIDEO_ALLOWED_EXTENSIONS,
  LESSON_VIDEO_MAX_BYTES,
  getFileExtension,
  isAllowedLessonVideoExtension,
} from "@/lib/uploads/lesson-video";

type LessonVideoUploadFormProps = {
  courseId: string;
  lessonId: string;
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  }

  return `${(bytes / 1_000_000).toFixed(0)} MB`;
}

export function LessonVideoUploadForm({
  courseId,
  lessonId,
}: LessonVideoUploadFormProps) {
  const missingEnvKeys = getMissingPublicAppwriteEnvKeys();
  const isDirectUploadConfigured = hasPublicAppwriteConfig();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDirectUploadConfigured) {
      toast.error(
        `Video upload is unavailable until ${missingEnvKeys.join(", ")} ${missingEnvKeys.length === 1 ? "is" : "are"} set in the deployment environment.`
      );
      return;
    }

    const file = inputRef.current?.files?.[0] ?? null;
    if (!file) {
      toast.error("Choose a lesson video first.");
      return;
    }

    const extension = getFileExtension(file.name);
    if (!isAllowedLessonVideoExtension(extension)) {
      toast.error(
        `Unsupported format. Use ${LESSON_VIDEO_ALLOWED_EXTENSIONS.join(", ")}.`
      );
      return;
    }

    if (file.size > LESSON_VIDEO_MAX_BYTES) {
      toast.error(
        `Lesson videos must be ${formatBytes(LESSON_VIDEO_MAX_BYTES)} or smaller.`
      );
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const tokenResponse = await fetch("/api/instructor/lesson-video/upload-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lessonId }),
      });

      const tokenPayload = (await tokenResponse.json().catch(() => null)) as
        | { jwt?: string; error?: string }
        | null;

      if (!tokenResponse.ok || !tokenPayload?.jwt) {
        throw new Error(tokenPayload?.error || "Failed to create upload session.");
      }

      const client = new Client()
        .setEndpoint(PUBLIC_APPWRITE_CONFIG.endpoint)
        .setProject(PUBLIC_APPWRITE_CONFIG.projectId)
        .setJWT(tokenPayload.jwt);
      const storage = new Storage(client);

      const uploaded = await storage.createFile({
        bucketId: PUBLIC_APPWRITE_CONFIG.buckets.courseVideos,
        fileId: ID.unique(),
        file,
        onProgress: (snapshot) => {
          setProgress(snapshot.progress);
        },
      });

      const completeResponse = await fetch("/api/instructor/lesson-video/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId,
          fileId: uploaded.$id,
        }),
      });

      const completePayload = (await completeResponse.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!completeResponse.ok || !completePayload?.success) {
        throw new Error(completePayload?.error || "Failed to attach uploaded video.");
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setProgress(100);
      toast.success("Lesson video uploaded.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload lesson video."
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (!isDirectUploadConfigured) {
    return (
      <div className="space-y-2 border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        <p className="font-medium">Video upload is temporarily unavailable on this deployment.</p>
        <p>
          Missing public Appwrite environment {missingEnvKeys.length === 1 ? "variable" : "variables"}:{" "}
          {missingEnvKeys.join(", ")}.
        </p>
        <p className="text-muted-foreground">
          Lesson creation and edits still work. Add the missing variable{missingEnvKeys.length === 1 ? "" : "s"} in
          the deployment settings and redeploy to enable direct video uploads again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".mp4,.webm,.mov"
          disabled={isUploading}
          className="text-xs file:mr-2 file:h-8 file:border file:border-border file:bg-background file:px-3 file:text-xs disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isUploading}
          className="h-8 shrink-0 border border-border px-3 text-xs hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Direct Appwrite upload. Supports {LESSON_VIDEO_ALLOWED_EXTENSIONS.join(", ")} up to{" "}
        {formatBytes(LESSON_VIDEO_MAX_BYTES)}.
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
