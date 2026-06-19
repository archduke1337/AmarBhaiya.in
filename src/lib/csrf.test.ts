import { describe, expect, it } from "vitest";

import { validateOrigin } from "./csrf";

function createRequest(
  headers: Record<string, string>
): Request {
  return new Request("https://amarbhaiya.in/app/dashboard", {
    method: "POST",
    headers,
  });
}

describe("validateOrigin", () => {
  it("returns 403 when both Origin and Referer are missing", () => {
    const request = createRequest({});
    const result = validateOrigin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns null when Origin matches an allowed origin", () => {
    const request = createRequest({
      origin: "https://amarbhaiya.in",
    });
    const result = validateOrigin(request);
    expect(result).toBeNull();
  });

  it("returns null when Referer matches an allowed origin", () => {
    const request = createRequest({
      referer: "https://amarbhaiya.in/some-page",
    });
    const result = validateOrigin(request);
    expect(result).toBeNull();
  });

  it("returns null when www variant matches", () => {
    const request = createRequest({
      origin: "https://www.amarbhaiya.in",
    });
    const result = validateOrigin(request);
    expect(result).toBeNull();
  });

  it("returns null when community subdomain matches", () => {
    const request = createRequest({
      origin: "https://community.amarbhaiya.in",
    });
    const result = validateOrigin(request);
    expect(result).toBeNull();
  });

  it("returns 403 when Origin is a disallowed domain", () => {
    const request = createRequest({
      origin: "https://evil.com",
    });
    const result = validateOrigin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns 403 when Referer is a disallowed domain", () => {
    const request = createRequest({
      referer: "https://evil.com/phish",
    });
    const result = validateOrigin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns 400 when Origin is malformed", () => {
    const request = createRequest({
      origin: "not-a-url",
    });
    const result = validateOrigin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
  });

  it("returns 400 when Referer is malformed", () => {
    const request = createRequest({
      referer: "not-a-url",
    });
    const result = validateOrigin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
  });

  it("prefers Origin over Referer when both present", () => {
    const request = createRequest({
      origin: "https://evil.com",
      referer: "https://amarbhaiya.in/page",
    });
    const result = validateOrigin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });
});
