import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  accountGetMock,
  createAdminClientMock,
  createRazorpayOrderMock,
  createSessionClientMock,
  createRowMock,
  getRazorpayPublicKeyMock,
  getRowMock,
  listRowsMock,
} = vi.hoisted(() => ({
  accountGetMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  createRazorpayOrderMock: vi.fn(),
  createSessionClientMock: vi.fn(),
  createRowMock: vi.fn(),
  getRazorpayPublicKeyMock: vi.fn(),
  getRowMock: vi.fn(),
  listRowsMock: vi.fn(),
}));

vi.mock("@/lib/appwrite/server", () => ({
  createAdminClient: createAdminClientMock,
  createSessionClient: createSessionClientMock,
}));

vi.mock("@/lib/payments/razorpay", () => ({
  createRazorpayOrder: createRazorpayOrderMock,
  getRazorpayPublicKey: getRazorpayPublicKeyMock,
}));

vi.mock("node-appwrite", async () => {
  const actual = await vi.importActual<typeof import("node-appwrite")>("node-appwrite");
  return {
    ...actual,
    ID: {
      unique: vi.fn(() => "payment_row_1"),
    },
  };
});

import { POST } from "./route";

describe("POST /api/payments/razorpay/create-order", () => {
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

    getRowMock.mockResolvedValue({
      $id: "course_1",
      price: 499,
      accessModel: "paid",
      isPublished: true,
    });

    listRowsMock.mockResolvedValue({ rows: [] });
    createRowMock.mockResolvedValue({ $id: "payment_row_1" });
    createRazorpayOrderMock.mockResolvedValue({
      id: "order_1",
      amount: 49900,
      currency: "INR",
    });
    getRazorpayPublicKeyMock.mockReturnValue("rzp_test_key");

    createAdminClientMock.mockResolvedValue({
      tablesDB: {
        getRow: getRowMock,
        listRows: listRowsMock,
        createRow: createRowMock,
      },
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    createSessionClientMock.mockRejectedValueOnce(new Error("No session"));

    const request = new Request("http://localhost/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId: "course_1", currency: "INR" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 404 for unpublished courses", async () => {
    getRowMock.mockResolvedValueOnce({
      $id: "course_1",
      price: 499,
      accessModel: "paid",
      isPublished: false,
    });

    const request = new Request("http://localhost/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId: "course_1", currency: "INR" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Course not available" });
    expect(createRazorpayOrderMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the user already has an active enrollment", async () => {
    listRowsMock.mockResolvedValueOnce({
      rows: [{ $id: "enrollment_1", isActive: true, status: "active" }],
    });

    const request = new Request("http://localhost/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId: "course_1", currency: "INR" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "You are already enrolled in this course." });
    expect(createRazorpayOrderMock).not.toHaveBeenCalled();
  });

  it("creates a payment order for eligible paid courses", async () => {
    const request = new Request("http://localhost/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId: "course_1", currency: "INR" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createRazorpayOrderMock).toHaveBeenCalledWith({
      amount: 49900,
      currency: "INR",
      receipt: expect.stringContaining("r_"),
      notes: {
        userId: "user_1",
        courseId: "course_1",
        accessModel: "paid",
      },
    });
    expect(createRowMock).toHaveBeenCalled();
    expect(body).toEqual({
      keyId: "rzp_test_key",
      orderId: "order_1",
      amount: 49900,
      currency: "INR",
      paymentId: "payment_row_1",
    });
  });
});
