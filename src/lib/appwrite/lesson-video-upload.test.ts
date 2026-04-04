import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminClientMock,
  revalidatePathMock,
  userCanManageCourseMock,
  validateStoredAppwriteFileSignatureMock,
  deleteFileMock,
  getFileMock,
  getRowMock,
  updateRowMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  userCanManageCourseMock: vi.fn(),
  validateStoredAppwriteFileSignatureMock: vi.fn(),
  deleteFileMock: vi.fn(),
  getFileMock: vi.fn(),
  getRowMock: vi.fn(),
  updateRowMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/appwrite/access", () => ({
  userCanManageCourse: userCanManageCourseMock,
}));

vi.mock("@/lib/appwrite/server", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/appwrite/file-signature", () => ({
  validateStoredAppwriteFileSignature: validateStoredAppwriteFileSignatureMock,
}));

import { finalizeLessonVideoUpload } from "./lesson-video-upload";

describe("finalizeLessonVideoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    userCanManageCourseMock.mockResolvedValue({
      $id: "course_1",
      slug: "maths-class-10",
    });

    getRowMock.mockResolvedValue({
      $id: "lesson_1",
      courseId: "course_1",
      videoFileId: "",
    });

    getFileMock.mockResolvedValue({
      $id: "file_1",
      name: "lesson.mp4",
    });

    createAdminClientMock.mockResolvedValue({
      tablesDB: {
        getRow: getRowMock,
        updateRow: updateRowMock,
      },
      storage: {
        getFile: getFileMock,
        deleteFile: deleteFileMock,
      },
    });
  });

  it("rejects uploaded files whose content does not match the claimed lesson video type", async () => {
    validateStoredAppwriteFileSignatureMock.mockResolvedValue(false);

    const result = await finalizeLessonVideoUpload({
      courseId: "course_1",
      lessonId: "lesson_1",
      uploadedFileId: "file_1",
      userId: "instructor_1",
      role: "instructor",
    });

    expect(result).toEqual({
      success: false,
      status: 400,
      error: "Uploaded video content does not match the allowed file type.",
    });
    expect(deleteFileMock).toHaveBeenCalledWith({
      bucketId: "course_videos",
      fileId: "file_1",
    });
    expect(updateRowMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
