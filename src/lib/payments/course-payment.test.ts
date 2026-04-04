import { beforeEach, describe, expect, it, vi } from "vitest";

import { reconcileCoursePayment } from "./course-payment";

describe("reconcileCoursePayment", () => {
  const listRowsMock = vi.fn();
  const getRowMock = vi.fn();
  const updateRowMock = vi.fn();
  const createRowMock = vi.fn();

  const tablesDB = {
    listRows: listRowsMock,
    getRow: getRowMock,
    updateRow: updateRowMock,
    createRow: createRowMock,
  } as unknown as Parameters<typeof reconcileCoursePayment>[0]["tablesDB"];

  beforeEach(() => {
    vi.clearAllMocks();
    getRowMock.mockResolvedValue({
      $id: "course_1",
      slug: "course-1",
      accessModel: "paid",
      price: 1,
    });
  });

  it("does not create a payment row when providerRef is unknown locally", async () => {
    listRowsMock.mockResolvedValueOnce({ rows: [] });

    const result = await reconcileCoursePayment({
      tablesDB,
      providerRef: "order_1",
      status: "completed",
      userId: "user_1",
      courseId: "course_1",
      amount: 100,
      currency: "INR",
    });

    expect(result.paymentFound).toBe(false);
    expect(result.finalStatus).toBeNull();
    expect(createRowMock).not.toHaveBeenCalled();
    expect(updateRowMock).not.toHaveBeenCalled();
  });

  it("deactivates enrollment when a completed payment is refunded", async () => {
    listRowsMock
      .mockResolvedValueOnce({
        rows: [
          {
            $id: "payment_1",
            userId: "user_1",
            courseId: "course_1",
            amount: 100,
            currency: "INR",
            status: "completed",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            $id: "enrollment_1",
            userId: "user_1",
            courseId: "course_1",
            paymentId: "payment_1",
            accessModel: "paid",
            isActive: true,
            status: "active",
          },
        ],
      });

    const result = await reconcileCoursePayment({
      tablesDB,
      providerRef: "order_1",
      status: "refunded",
      userId: "user_1",
      courseId: "course_1",
      amount: 100,
      currency: "INR",
    });

    expect(result.paymentFound).toBe(true);
    expect(result.finalStatus).toBe("refunded");
    expect(updateRowMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        rowId: "payment_1",
        data: expect.objectContaining({ status: "refunded" }),
      })
    );
    expect(updateRowMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        rowId: "enrollment_1",
        data: expect.objectContaining({ isActive: false }),
      })
    );
  });

  it("ignores non-monotonic status rewrites", async () => {
    listRowsMock.mockResolvedValueOnce({
      rows: [
        {
          $id: "payment_1",
          userId: "user_1",
          courseId: "course_1",
          amount: 100,
          currency: "INR",
          status: "completed",
        },
      ],
    });

    const result = await reconcileCoursePayment({
      tablesDB,
      providerRef: "order_1",
      status: "failed",
      userId: "user_1",
      courseId: "course_1",
      amount: 100,
      currency: "INR",
    });

    expect(result.paymentFound).toBe(true);
    expect(result.finalStatus).toBe("completed");
    expect(updateRowMock).not.toHaveBeenCalled();
  });
});
