import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/appwrite/server", () => ({
  createAdminClient: createAdminClientMock,
}));

import { POST } from "./route";

describe("POST /api/auth/login", () => {
  const createEmailPasswordSessionMock = vi.fn();

  beforeEach(() => {
    createEmailPasswordSessionMock.mockReset();

    createAdminClientMock.mockResolvedValue({
      account: {
        createEmailPasswordSession: createEmailPasswordSessionMock,
      },
    });
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "12345678" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Please enter a valid email address.");
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("creates session, sets cookie, and returns success", async () => {
    createEmailPasswordSessionMock.mockResolvedValue({
      secret: "session-secret",
      expire: "2030-01-01T00:00:00.000Z",
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(createEmailPasswordSessionMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
    expect(setCookie).toContain(`${APPWRITE_CONFIG.sessionCookieName}=session-secret`);
  });

  it("maps invalid credential errors to 401", async () => {
    createEmailPasswordSessionMock.mockRejectedValue(new Error("Invalid credentials"));

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid email or password." });
  });

  it("returns 500 for non-auth failures", async () => {
    createEmailPasswordSessionMock.mockRejectedValue(new Error("Service unavailable"));

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Service unavailable" });
  });
});