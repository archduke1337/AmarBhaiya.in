import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

const { createPublicClientMock } = vi.hoisted(() => ({
  createPublicClientMock: vi.fn(),
}));

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}));

const { checkRateLimitMock, getRateLimitKeyMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
  getRateLimitKeyMock: vi.fn().mockReturnValue("test-ip"),
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: checkRateLimitMock,
  getRateLimitKey: getRateLimitKeyMock,
}));

vi.mock("@/lib/appwrite/server", () => ({
  createPublicClient: createPublicClientMock,
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: checkRateLimitMock,
  getRateLimitKey: vi.fn().mockReturnValue("test-ip"),
}));

vi.mock("node-appwrite", () => ({
  ID: {
    unique: vi.fn(() => "mock-user-id"),
  },
}));

import { POST } from "./route";

describe("POST /api/auth/register", () => {
  const createMock = vi.fn();
  const createEmailPasswordSessionMock = vi.fn();

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost";
    createMock.mockReset();
    createEmailPasswordSessionMock.mockReset();
    createAdminClientMock.mockReset();
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000 });

    createPublicClientMock.mockResolvedValue({
      account: {
        create: createMock,
      },
    });

    createAdminClientMock.mockResolvedValue({
      account: {
        createEmailPasswordSession: createEmailPasswordSessionMock,
      },
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        name: "A",
        email: "not-an-email",
        password: "short",
        consent: false,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Name must be at least 2 characters.");
    expect(createPublicClientMock).not.toHaveBeenCalled();
  });

  it("creates account and session, sets cookie, and returns success", async () => {
    createMock.mockResolvedValue({ $id: "mock-user-id" });
    createEmailPasswordSessionMock.mockResolvedValue({
      secret: "session-secret",
      expire: "2030-01-01T00:00:00.000Z",
    });

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        name: "Test User",
        email: "user@example.com",
        password: "Password123!",
        consent: true,
      }),
    });

    const response = await POST(request);
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(createMock).toHaveBeenCalledWith({
      userId: "mock-user-id",
      email: "user@example.com",
      password: "Password123!",
      name: "Test User",
    });
    expect(createEmailPasswordSessionMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Password123!",
    });
    expect(setCookie).toContain(`${APPWRITE_CONFIG.sessionCookieName}=session-secret`);
  });

  it("maps already exists errors to 409", async () => {
    createMock.mockRejectedValue(new Error("User already exists"));

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        name: "Test User",
        email: "user@example.com",
        password: "Password123!",
        consent: true,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "An account with this email already exists." });
    expect(createEmailPasswordSessionMock).not.toHaveBeenCalled();
  });

  it("returns 500 for non-conflict failures", async () => {
    createMock.mockRejectedValue(new Error("Service unavailable"));

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        name: "Test User",
        email: "user@example.com",
        password: "Password123!",
        consent: true,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Registration failed. Please try again." });
  });

  it("returns 500 if the auto-login session has no secret", async () => {
    createMock.mockResolvedValue({ $id: "mock-user-id" });
    createEmailPasswordSessionMock.mockResolvedValue({
      secret: "",
      expire: "2030-01-01T00:00:00.000Z",
    });

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({
        name: "Test User",
        email: "user@example.com",
        password: "Password123!",
        consent: true,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Registration failed. Please try again." });
  });
});
