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

    const request = new Request("https://community.amarbhaiya.in/api/auth/logout", {
      method: "POST",
      headers: {
        host: "community.amarbhaiya.in",
      },
    });

    const response = await POST(request);
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(deleteSessionMock).toHaveBeenCalledWith({ sessionId: "current" });
    expect(setCookie).toContain(`${APPWRITE_CONFIG.sessionCookieName}=`);
    expect(setCookie).toContain("Expires=");
    expect(setCookie).toContain("Domain=.amarbhaiya.in");
  });

  it("still clears cookie when no session client is available", async () => {
    createSessionClientMock.mockRejectedValue(new Error("No session"));

    const request = new Request("https://amarbhaiya.in/api/auth/logout", {
      method: "POST",
      headers: {
        host: "amarbhaiya.in",
      },
    });

    const response = await POST(request);
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(setCookie).toContain(`${APPWRITE_CONFIG.sessionCookieName}=`);
    expect(setCookie).toContain("Expires=");
    expect(setCookie).toContain("Domain=.amarbhaiya.in");
  });
});
