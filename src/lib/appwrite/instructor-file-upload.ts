import { revalidatePath } from "next/cache";

import {
  userCanManageCourse,
  userCanManageCourseResource,
  userCanManageResource,
} from "@/lib/appwrite/access";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  type InstructorUploadKind,
  INSTRUCTOR_UPLOAD_BUCKETS,
  getUploadFileExtension,
  isAllowedInstructorUploadExtension,
} from "@/lib/uploads/instructor-file";
import type { Role } from "@/lib/utils/constants";

type UploadTargetInput = {
  kind: InstructorUploadKind;
  userId: string;
  role: Role;
  courseId?: string;
  resourceId?: string;
};

type FinalizeInstructorUploadInput = UploadTargetInput & {
  uploadedFileId: string;
};

type FinalizeInstructorUploadResult =
  | { success: true }
  | { success: false; status: number; error: string };

function getCourseThumbnailFileId(course: Record<string, unknown>): string {
  return String(course.thumbnailFileId ?? course.thumbnailId ?? "");
}

async function deleteUploadedFileIfPresent(
  storage: Awaited<ReturnType<typeof createAdminClient>>["storage"],
  bucketId: string,
  fileId: string
): Promise<void> {
  if (!fileId) {
    return;
  }

  try {
    await storage.deleteFile({ bucketId, fileId });
  } catch (error) {
    console.error(
      `[InstructorUpload] Failed to clean up ${bucketId}/${fileId}:`,
      error instanceof Error ? error.message : error
    );
  }
}

export async function getManageableInstructorUploadTarget(
  input: UploadTargetInput
): Promise<{ bucketId: string } | null> {
  const { kind, userId, role, courseId, resourceId } = input;

  if (kind === "course-thumbnail") {
    if (!courseId) {
      return null;
    }

    const course = await userCanManageCourse(courseId, role, userId);
    return course
      ? { bucketId: INSTRUCTOR_UPLOAD_BUCKETS["course-thumbnail"] }
      : null;
  }

  if (kind === "standalone-resource") {
    if (!resourceId) {
      return null;
    }

    const resource = await userCanManageResource(resourceId, role, userId);
    return resource
      ? { bucketId: INSTRUCTOR_UPLOAD_BUCKETS["standalone-resource"] }
      : null;
  }

  if (!resourceId) {
    return null;
  }

  const resourceContext = await userCanManageCourseResource(resourceId, role, userId);
  return resourceContext
    ? { bucketId: INSTRUCTOR_UPLOAD_BUCKETS["course-resource"] }
    : null;
}

export async function finalizeInstructorUpload(
  input: FinalizeInstructorUploadInput
): Promise<FinalizeInstructorUploadResult> {
  const { kind, uploadedFileId, userId, role, courseId, resourceId } = input;
  const bucketId = INSTRUCTOR_UPLOAD_BUCKETS[kind];
  const { storage, tablesDB } = await createAdminClient();

  const uploadedFile = await storage
    .getFile({
      bucketId,
      fileId: uploadedFileId,
    })
    .catch(() => null);

  if (!uploadedFile) {
    return { success: false, status: 404, error: "Uploaded file not found." };
  }

  const extension = getUploadFileExtension(String(uploadedFile.name ?? ""));
  if (!isAllowedInstructorUploadExtension(kind, extension)) {
    await deleteUploadedFileIfPresent(storage, bucketId, uploadedFileId);
    return { success: false, status: 400, error: "Unsupported file format." };
  }

  if (kind === "course-thumbnail") {
    if (!courseId) {
      return { success: false, status: 400, error: "Missing courseId." };
    }

    const course = await userCanManageCourse(courseId, role, userId);
    if (!course) {
      await deleteUploadedFileIfPresent(storage, bucketId, uploadedFileId);
      return { success: false, status: 403, error: "Forbidden" };
    }

    const previousThumbnailId = getCourseThumbnailFileId(course);

    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.courses,
        rowId: courseId,
        data: {
          thumbnailId: uploadedFileId,
          thumbnailFileId: uploadedFileId,
        },
      });
    } catch {
      try {
        await tablesDB.updateRow({
          databaseId: APPWRITE_CONFIG.databaseId,
          tableId: APPWRITE_CONFIG.tables.courses,
          rowId: courseId,
          data: { thumbnailId: uploadedFileId },
        });
      } catch (error) {
        await deleteUploadedFileIfPresent(storage, bucketId, uploadedFileId);
        return {
          success: false,
          status: 500,
          error:
            error instanceof Error
              ? error.message
              : "Failed to attach uploaded thumbnail.",
        };
      }
    }

    if (previousThumbnailId && previousThumbnailId !== uploadedFileId) {
      await deleteUploadedFileIfPresent(storage, bucketId, previousThumbnailId);
    }

    revalidatePath("/instructor");
    revalidatePath("/instructor/courses");
    revalidatePath(`/instructor/courses/${courseId}`);
    revalidatePath("/courses");
    if (typeof course.slug === "string" && course.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }

    return { success: true };
  }

  if (kind === "standalone-resource") {
    if (!resourceId) {
      return { success: false, status: 400, error: "Missing resourceId." };
    }

    const resource = await userCanManageResource(resourceId, role, userId);
    if (!resource) {
      await deleteUploadedFileIfPresent(storage, bucketId, uploadedFileId);
      return { success: false, status: 403, error: "Forbidden" };
    }

    const previousFileId = String(resource.fileId ?? "");

    try {
      await tablesDB.updateRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tables.standaloneResources,
        rowId: resourceId,
        data: { fileId: uploadedFileId },
      });
    } catch (error) {
      await deleteUploadedFileIfPresent(storage, bucketId, uploadedFileId);
      return {
        success: false,
        status: 500,
        error:
          error instanceof Error
            ? error.message
            : "Failed to attach uploaded resource file.",
      };
    }

    if (previousFileId && previousFileId !== uploadedFileId) {
      await deleteUploadedFileIfPresent(storage, bucketId, previousFileId);
    }

    revalidatePath("/instructor/resources");
    return { success: true };
  }

  if (!resourceId) {
    return { success: false, status: 400, error: "Missing resourceId." };
  }

  const resourceContext = await userCanManageCourseResource(resourceId, role, userId);
  if (!resourceContext) {
    await deleteUploadedFileIfPresent(storage, bucketId, uploadedFileId);
    return { success: false, status: 403, error: "Forbidden" };
  }

  const previousFileId = String(resourceContext.resource.fileId ?? "");

  try {
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.resources,
      rowId: resourceId,
      data: { fileId: uploadedFileId },
    });
  } catch (error) {
    await deleteUploadedFileIfPresent(storage, bucketId, uploadedFileId);
    return {
      success: false,
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Failed to attach uploaded course resource file.",
    };
  }

  if (previousFileId && previousFileId !== uploadedFileId) {
    await deleteUploadedFileIfPresent(storage, bucketId, previousFileId);
  }

  revalidatePath("/instructor/resources");
  revalidatePath(`/instructor/courses/${resourceContext.course.$id}/curriculum`);
  revalidatePath(`/app/learn/${resourceContext.course.$id}/${resourceContext.lesson.$id}`);

  return { success: true };
}
