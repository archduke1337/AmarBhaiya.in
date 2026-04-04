"use client";

import { startTransition, useRef, useState } from "react";
import { Client, ID, Storage } from "appwrite";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { uploadCourseThumbnailAction } from "@/actions/upload";
import {
  PUBLIC_APPWRITE_CONFIG,
  hasPublicAppwriteConfig,
} from "@/lib/appwrite/public-config";
import {
  getInstructorUploadMaxBytes,
  getUploadFileExtension,
  isAllowedInstructorUploadExtension,
} from "@/lib/uploads/instructor-file";

type CourseThumbnailUploadFormProps = {
  courseId: string;
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(0)} MB`;
  }

  return `${bytes} bytes`;
}

async function uploadThumbnailDirectly(courseId: string, file: File) {
  const tokenResponse = await fetch("/api/instructor/uploads/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "course-thumbnail",
      courseId,
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
  });

  const completeResponse = await fetch("/api/instructor/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "course-thumbnail",
      courseId,
      fileId: uploaded.$id,
    }),
  });

  const completePayload = (await completeResponse.json().catch(() => null)) as
    | { success?: boolean; error?: string }
    | null;

  if (!completeResponse.ok || !completePayload?.success) {
    throw new Error(
      completePayload?.error || "Failed to attach uploaded thumbnail."
    );
  }
}

export function CourseThumbnailUploadForm({
  courseId,
}: CourseThumbnailUploadFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const file = inputRef.current?.files?.[0] ?? null;
    if (!file) {
      toast.error("Choose an image first.");
      return;
    }

    const extension = getUploadFileExtension(file.name);
    if (!isAllowedInstructorUploadExtension("course-thumbnail", extension)) {
      toast.error("Only JPG, PNG, and WEBP images are supported.");
      return;
    }

    const maxBytes = getInstructorUploadMaxBytes("course-thumbnail");
    if (file.size > maxBytes) {
      toast.error(`Images must be ${formatBytes(maxBytes)} or smaller.`);
      return;
    }

    setIsUploading(true);
    setStatusText("Uploading thumbnail...");

    let directUploadError: unknown = null;

    if (hasPublicAppwriteConfig()) {
      try {
        await uploadThumbnailDirectly(courseId, file);

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        toast.success("Course thumbnail uploaded.");
        startTransition(() => {
          router.refresh();
        });
        return;
      } catch (error) {
        directUploadError = error;
        setStatusText("Direct upload failed. Retrying securely...");
      }
    } else {
      setStatusText("Using secure server upload...");
    }

    try {
      const formData = new FormData();
      formData.set("courseId", courseId);
      formData.set("file", file);

      const result = await uploadCourseThumbnailAction(formData);
      if (!result.success) {
        throw new Error(result.error);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      toast.success("Course thumbnail uploaded.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const fallbackError =
        error instanceof Error ? error.message : "Failed to upload thumbnail.";
      const directMessage =
        directUploadError instanceof Error ? directUploadError.message : "";

      toast.error(directMessage ? `${directMessage} ${fallbackError}` : fallbackError);
    } finally {
      setIsUploading(false);
      setStatusText("");
    }
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
          className="flex-1 text-xs file:mr-2 file:h-8 file:border file:border-border file:bg-background file:px-3 file:text-xs disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isUploading}
          className="h-8 shrink-0 border border-border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload Thumbnail"}
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Supports JPG, PNG, and WEBP up to 5 MB. The app will fall back to a
        secure server upload if direct browser upload is unavailable.
      </p>

      {statusText ? (
        <p className="text-[11px] text-muted-foreground">{statusText}</p>
      ) : null}
    </form>
  );
}
