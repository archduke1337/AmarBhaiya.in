import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, getRateLimitKey } from "./rate-limiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  it("allows first request within window", async () => {
    const result = await checkRateLimit("test-user-1", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks hits within the same key", async () => {
    const key = "tracking-user";
    for (let i = 0; i < 4; i++) {
      const result = await checkRateLimit(key, 5);
      expect(result.allowed).toBe(true);
    }

    const result = await checkRateLimit(key, 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks when max hits exceeded", async () => {
    const key = "block-user";
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, 2);
    }

    const result = await checkRateLimit(key, 2);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const key = "reset-user";
    await checkRateLimit(key, 2);
    await checkRateLimit(key, 2);
    const blocked = await checkRateLimit(key, 2);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(61_000);

    const after = await checkRateLimit(key, 2);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(1);
  });

  it("different keys are independent", async () => {
    const result1 = await checkRateLimit("independent-a", 1);
    const result2 = await checkRateLimit("independent-b", 1);
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);

    const result3 = await checkRateLimit("independent-a", 1);
    expect(result3.allowed).toBe(false);

    const result4 = await checkRateLimit("independent-b", 1);
    expect(result4.allowed).toBe(false);
  });
});

describe("getRateLimitKey", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getRateLimitKey(request)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when no x-forwarded-for header", () => {
    const request = new Request("https://example.com");
    expect(getRateLimitKey(request)).toBe("unknown");
  });

  it("trims whitespace from IP", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  10.0.0.1  " },
    });
    expect(getRateLimitKey(request)).toBe("10.0.0.1");
  });
});
