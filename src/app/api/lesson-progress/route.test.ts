import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  accountGetMock,
  createAdminClientMock,
  createRowMock,
  createSessionClientMock,
  listRowsMock,
  updateRowMock,
  userHasCourseAccessMock,
} = vi.hoisted(() => ({
  accountGetMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  createRowMock: vi.fn(),
  createSessionClientMock: vi.fn(),
  listRowsMock: vi.fn(),
  updateRowMock: vi.fn(),
  userHasCourseAccessMock: vi.fn(),
}));

vi.mock("@/lib/appwrite/server", () => ({
  createAdminClient: createAdminClientMock,
  createSessionClient: createSessionClientMock,
}));

vi.mock("@/lib/appwrite/access", () => ({
  userHasCourseAccess: userHasCourseAccessMock,
}));

import { POST } from "./route";

describe("POST /api/lesson-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    accountGetMock.mockResolvedValue({
      $id: "user_1",
      email: "student@example.com",
    });

    createSessionClientMock.mockResolvedValue({
      account: {
        get: accountGetMock,
      },
    });

    userHasCourseAccessMock.mockResolvedValue(true);

    listRowsMock.mockResolvedValue({ rows: [] });
    createRowMock.mockResolvedValue({ $id: "progress_1" });
    updateRowMock.mockResolvedValue({ $id: "progress_1" });

    createAdminClientMock.mockResolvedValue({
      tablesDB: {
        listRows: listRowsMock,
        createRow: createRowMock,
        updateRow: updateRowMock,
      },
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    createSessionClientMock.mockRejectedValueOnce(new Error("No session"));

    const request = new Request("http://localhost/api/lesson-progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        lessonId: "lesson_1",
        percentComplete: 25,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("retries on a unique-key conflict and updates the existing row", async () => {
    listRowsMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            $id: "progress_existing",
            userId: "user_1",
            courseId: "course_1",
            lessonId: "lesson_1",
            percentComplete: 20,
            completedAt: "",
          },
        ],
      });
    createRowMock.mockRejectedValueOnce({ code: 409 });

    const request = new Request("http://localhost/api/lesson-progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        lessonId: "lesson_1",
        percentComplete: 40,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, percentComplete: 40 });
    expect(updateRowMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rowId: "progress_existing",
        data: { percentComplete: 40 },
      })
    );
  });

  it("returns completed when the lesson is already completed", async () => {
    listRowsMock.mockResolvedValueOnce({
      rows: [
        {
          $id: "progress_existing",
          userId: "user_1",
          courseId: "course_1",
          lessonId: "lesson_1",
          percentComplete: 100,
          completedAt: "2026-04-04T12:00:00.000Z",
        },
      ],
    });

    const request = new Request("http://localhost/api/lesson-progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        lessonId: "lesson_1",
        percentComplete: 60,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, completed: true });
    expect(createRowMock).not.toHaveBeenCalled();
    expect(updateRowMock).not.toHaveBeenCalled();
  });

  it("returns a generic 500 response when persistence fails", async () => {
    listRowsMock.mockRejectedValueOnce(new Error("Database exploded"));

    const request = new Request("http://localhost/api/lesson-progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        lessonId: "lesson_1",
        percentComplete: 10,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to save progress." });
  });
});
