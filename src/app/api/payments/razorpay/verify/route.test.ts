import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  accountGetMock,
  createAdminClientMock,
  createSessionClientMock,
  listRowsMock,
  reconcileCoursePaymentMock,
  revalidatePathMock,
  verifyRazorpayPaymentSignatureMock,
} = vi.hoisted(() => ({
  accountGetMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  createSessionClientMock: vi.fn(),
  listRowsMock: vi.fn(),
  reconcileCoursePaymentMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  verifyRazorpayPaymentSignatureMock: vi.fn(),
}));

vi.mock("@/lib/appwrite/server", () => ({
  createAdminClient: createAdminClientMock,
  createSessionClient: createSessionClientMock,
}));

vi.mock("@/lib/payments/course-payment", () => ({
  reconcileCoursePayment: reconcileCoursePaymentMock,
}));

vi.mock("@/lib/payments/razorpay", () => ({
  verifyRazorpayPaymentSignature: verifyRazorpayPaymentSignatureMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { POST } from "./route";

describe("POST /api/payments/razorpay/verify", () => {
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

    listRowsMock.mockResolvedValue({ rows: [] });

    createAdminClientMock.mockResolvedValue({
      tablesDB: {
        listRows: listRowsMock,
      },
    });

    verifyRazorpayPaymentSignatureMock.mockReturnValue(true);

    reconcileCoursePaymentMock.mockResolvedValue({
      paymentId: "payment_1",
      courseId: "course_1",
      courseSlug: "maths-class-10",
      enrollmentCreated: true,
      enrollmentUpdated: false,
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    createSessionClientMock.mockRejectedValueOnce(new Error("No session"));

    const request = new Request("http://localhost/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "sig_1",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentId: "pay_1",
        signature: "sig_1",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeTruthy();
    expect(verifyRazorpayPaymentSignatureMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid Razorpay signature", async () => {
    verifyRazorpayPaymentSignatureMock.mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "sig_1",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid payment signature" });
    expect(reconcileCoursePaymentMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the order belongs to a different user", async () => {
    listRowsMock.mockResolvedValueOnce({
      rows: [{ $id: "payment_1", userId: "other_user", courseId: "course_1" }],
    });

    const request = new Request("http://localhost/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "sig_1",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(reconcileCoursePaymentMock).not.toHaveBeenCalled();
  });

  it("returns 404 when there is no local pending payment row", async () => {
    listRowsMock.mockResolvedValueOnce({ rows: [] });

    const request = new Request("http://localhost/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "sig_1",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Payment session not found." });
    expect(reconcileCoursePaymentMock).not.toHaveBeenCalled();
  });

  it("returns 409 for terminal payment rows", async () => {
    listRowsMock.mockResolvedValueOnce({
      rows: [{ $id: "payment_1", userId: "user_1", courseId: "course_1", status: "refunded" }],
    });

    const request = new Request("http://localhost/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "sig_1",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "This payment can no longer be verified." });
    expect(reconcileCoursePaymentMock).not.toHaveBeenCalled();
  });

  it("reconciles the payment and revalidates learning surfaces", async () => {
    listRowsMock.mockResolvedValueOnce({
      rows: [{ $id: "payment_1", userId: "user_1", courseId: "course_1", amount: 100, currency: "INR" }],
    });

    const request = new Request("http://localhost/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: "course_1",
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "sig_1",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(reconcileCoursePaymentMock).toHaveBeenCalledWith({
      tablesDB: expect.any(Object),
      providerRef: "order_1",
      status: "completed",
      userId: "user_1",
      courseId: "course_1",
      amount: 100,
      currency: "INR",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/courses");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/payments");
    expect(revalidatePathMock).toHaveBeenCalledWith("/instructor/earnings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/courses/maths-class-10");
  });
});
