import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

const { createSessionClientMock } = vi.hoisted(() => ({
  createSessionClientMock: vi.fn(),
}));

vi.mock("@/lib/appwrite/server", () => ({
  createSessionClient: createSessionClientMock,
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  const deleteSessionMock = vi.fn();

  beforeEach(() => {
    deleteSessionMock.mockReset();
  });

  it("deletes current session when available and clears cookie", async () => {
    createSessionClientMock.mockResolvedValue({
      account: {
        deleteSession: deleteSessionMock,
      },
    });

    const response = await POST();
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(deleteSessionMock).toHaveBeenCalledWith({ sessionId: "current" });
    expect(setCookie).toContain(`${APPWRITE_CONFIG.sessionCookieName}=`);
    expect(setCookie).toContain("Expires=");
  });

  it("still clears cookie when no session client is available", async () => {
    createSessionClientMock.mockRejectedValue(new Error("No session"));

    const response = await POST();
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(setCookie).toContain(`${APPWRITE_CONFIG.sessionCookieName}=`);
    expect(setCookie).toContain("Expires=");
  });
});