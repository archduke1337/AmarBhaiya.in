import { describe, expect, it } from "vitest";

import {
  buildExpiredSessionCookieOptions,
  buildSessionCookieOptions,
  resolveSessionCookieDomain,
} from "./session-cookie";

describe("session-cookie helpers", () => {
  it("shares sessions across the amarbhaiya.in root domain and subdomains", () => {
    expect(resolveSessionCookieDomain("amarbhaiya.in")).toBe(".amarbhaiya.in");
    expect(resolveSessionCookieDomain("community.amarbhaiya.in")).toBe(
      ".amarbhaiya.in"
    );
  });

  it("avoids forcing a cookie domain for unrelated hosts", () => {
    expect(resolveSessionCookieDomain("localhost:3000")).toBeUndefined();
    expect(resolveSessionCookieDomain("example.com")).toBeUndefined();
  });

  it("builds consistent cookie options for active and expired sessions", () => {
    const active = buildSessionCookieOptions({
      expire: "2030-01-01T00:00:00.000Z",
      host: "community.amarbhaiya.in",
    });
    const expired = buildExpiredSessionCookieOptions({
      host: "amarbhaiya.in",
    });

    expect(active.domain).toBe(".amarbhaiya.in");
    expect(active.sameSite).toBe("lax");
    expect(active.httpOnly).toBe(true);
    expect(expired.domain).toBe(".amarbhaiya.in");
    expect(expired.expires.getTime()).toBe(0);
  });
});
