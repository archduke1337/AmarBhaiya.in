import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAuthMock,
  createAdminClientMock,
  listRowsMock,
  updateRowMock,
} = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  listRowsMock: vi.fn(),
  updateRowMock: vi.fn(),
}));

vi.mock("@/lib/appwrite/auth", () => ({
  requireAuth: requireAuthMock,
  requireRole: vi.fn(),
}));

vi.mock("@/lib/appwrite/server", () => ({
  createAdminClient: createAdminClientMock,
}));

import { getUserSubscription } from "./subscriptions";

describe("getUserSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireAuthMock.mockResolvedValue({
      $id: "user_1",
      name: "Student One",
      email: "student@example.com",
    });

    createAdminClientMock.mockResolvedValue({
      tablesDB: {
        listRows: listRowsMock,
        updateRow: updateRowMock,
      },
    });
  });

  it("keeps paginating until it finds an older active subscription", async () => {
    const expiredRows = Array.from({ length: 500 }, (_, index) => ({
      $id: `sub_${index + 1}`,
      userId: "user_1",
      planId: "basic",
      planName: "Basic",
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-02-01T00:00:00.000Z",
      status: "expired",
    }));

    listRowsMock
      .mockResolvedValueOnce({ rows: expiredRows, total: 501 })
      .mockResolvedValueOnce({
        rows: [
          {
            $id: "sub_active",
            userId: "user_1",
            planId: "pro",
            planName: "Pro",
            startDate: "2026-04-01T00:00:00.000Z",
            endDate: "2026-05-01T00:00:00.000Z",
            status: "active",
          },
        ],
        total: 501,
      });

    const subscription = await getUserSubscription();

    expect(subscription).toEqual(
      expect.objectContaining({
        id: "sub_active",
        userId: "user_1",
        planId: "pro",
        status: "active",
      })
    );
    expect(listRowsMock).toHaveBeenCalledTimes(2);
  });
});
