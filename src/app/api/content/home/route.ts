import { NextResponse } from "next/server";

import { getHomePageContent } from "@/lib/appwrite/marketing-content";

export const runtime = "nodejs";

export async function GET() {
  try {
    const content = await getHomePageContent();
    return NextResponse.json(content, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch homepage content.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
