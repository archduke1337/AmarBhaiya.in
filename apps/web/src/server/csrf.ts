import { NextResponse } from "next/server";

export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = origin ?? referer;

  if (!source) {
    return NextResponse.json(
      { error: "Missing Origin or Referer header" },
      { status: 403 }
    );
  }

  const allowedOrigins: string[] = [
    process.env.NEXT_PUBLIC_APP_URL ?? "",
    "https://amarbhaiya.in",
    "https://www.amarbhaiya.in",
    "https://community.amarbhaiya.in",
  ].filter(Boolean);

  try {
    const sourceUrl = new URL(source);
    const isAllowed = allowedOrigins.some((allowed) => {
      if (!allowed) return false;
      const allowedUrl = new URL(allowed);
      return sourceUrl.origin === allowedUrl.origin;
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid Origin or Referer header" },
      { status: 400 }
    );
  }

  return null;
}
