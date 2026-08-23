import { NextResponse } from "next/server";
import { ALLOWED_ORIGINS } from "@/lib/utils/allowed-origins";

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

  const allowedOrigins: string[] = ALLOWED_ORIGINS;

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
