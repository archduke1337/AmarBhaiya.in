import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAuthMock, createAdminClientMock, listRowsMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  listRowsMock: vi.fn(),
}));

vi.mock("@/lib/appwrite/auth", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/lib/appwrite/server", () => ({
  createAdminClient: createAdminClientMock,
}));

import { createNotificationEntry, getUserNotifications } from "./notifications";

describe("notifications schema compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireAuthMock.mockResolvedValue({ $id: "user_1" });
    createAdminClientMock.mockResolvedValue({
      tablesDB: {
        listRows: listRowsMock,
      },
    });
  });

  it("maps schema-native message/actionUrl fields into UI body/link fields", async () => {
    listRowsMock.mockResolvedValueOnce({
      rows: [
        {
          $id: "notif_1",
          userId: "user_1",
          type: "assignment_feedback",
          title: "Assignment graded",
          message: "You scored 92%.",
          actionUrl: "/app/assignments#assignment-1",
          isRead: false,
          createdAt: "2026-04-04T00:00:00.000Z",
        },
        {
          $id: "notif_2",
          userId: "user_1",
          type: "legacy",
          title: "Legacy row",
          body: "Old body field",
          link: "/app/notifications#legacy",
          isRead: true,
          createdAt: "2026-04-03T00:00:00.000Z",
        },
      ],
    });

    const notifications = await getUserNotifications();

    expect(notifications).toEqual([
      expect.objectContaining({
        id: "notif_1",
        body: "You scored 92%.",
        link: "/app/assignments#assignment-1",
      }),
      expect.objectContaining({
        id: "notif_2",
        body: "Old body field",
        link: "/app/notifications#legacy",
      }),
    ]);
  });

  it("loads notification history beyond the first page", async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) => ({
      $id: `notif_${index + 1}`,
      userId: "user_1",
      type: "info",
      title: `Notification ${index + 1}`,
      message: `Body ${index + 1}`,
      actionUrl: `/app/notifications#notification-${index + 1}`,
      isRead: index % 2 === 0,
      createdAt: "2026-04-04T00:00:00.000Z",
    }));

    listRowsMock
      .mockResolvedValueOnce({ rows: firstPage })
      .mockResolvedValueOnce({
        rows: [
          {
            $id: "notif_501",
            userId: "user_1",
            type: "info",
            title: "Notification 501",
            message: "Body 501",
            actionUrl: "/app/notifications#notification-501",
            isRead: false,
            createdAt: "2026-04-03T00:00:00.000Z",
          },
        ],
      });

    const notifications = await getUserNotifications();

    expect(notifications).toHaveLength(501);
    expect(notifications.at(-1)).toEqual(
      expect.objectContaining({
        id: "notif_501",
        body: "Body 501",
        link: "/app/notifications#notification-501",
      })
    );
    expect(listRowsMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to legacy body/link writes when the deployed table shape has not been migrated", async () => {
    const createRowMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Unknown attribute: message"))
      .mockResolvedValueOnce(undefined);

    await createNotificationEntry(
      {
        userId: "user_1",
        type: "info",
        title: "Hello",
        body: "Message body",
        link: "/app/dashboard",
      },
      {
        createRow: createRowMock,
      } as never
    );

    expect(createRowMock).toHaveBeenCalledTimes(2);
    expect(createRowMock.mock.calls[0][0].data).toMatchObject({
      message: "Message body",
      actionUrl: "http://localhost:3000/app/dashboard",
    });
    expect(createRowMock.mock.calls[1][0].data).toMatchObject({
      body: "Message body",
      link: "/app/dashboard",
    });
  });
});
