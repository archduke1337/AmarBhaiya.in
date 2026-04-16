import { headers } from "next/headers";

const DEFAULT_ROOT_COOKIE_DOMAIN = "amarbhaiya.in";

function normalizeHost(host: string | null | undefined): string {
  if (typeof host !== "string") {
    return "";
  }

  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

function getRootCookieDomain(): string {
  return (
    process.env.SESSION_COOKIE_BASE_DOMAIN?.trim().toLowerCase() ||
    DEFAULT_ROOT_COOKIE_DOMAIN
  );
}

export function resolveSessionCookieDomain(
  host: string | null | undefined
): string | undefined {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return undefined;
  }

  const rootDomain = getRootCookieDomain();
  if (
    normalizedHost === rootDomain ||
    normalizedHost.endsWith(`.${rootDomain}`)
  ) {
    return `.${rootDomain}`;
  }

  return undefined;
}

export function buildSessionCookieOptions({
  expire,
  host,
}: {
  expire: string;
  host?: string | null;
}) {
  const domain = resolveSessionCookieDomain(host);

  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expire),
    ...(domain ? { domain } : {}),
  };
}

export function buildExpiredSessionCookieOptions({
  host,
}: {
  host?: string | null;
}) {
  const domain = resolveSessionCookieDomain(host);

  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    ...(domain ? { domain } : {}),
  };
}

export async function getServerActionSessionCookieOptions(expire: string) {
  const headerStore = await headers();
  return buildSessionCookieOptions({
    expire,
    host: headerStore.get("host"),
  });
}

export async function getServerActionExpiredSessionCookieOptions() {
  const headerStore = await headers();
  return buildExpiredSessionCookieOptions({
    host: headerStore.get("host"),
  });
}
