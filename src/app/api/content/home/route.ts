import { NextResponse } from "next/server";

import { getHomePageContent } from "@/lib/appwrite/marketing-content";

export const runtime = "nodejs";

export async function GET() {
  try {
    const content = await getHomePageContent();
    return NextResponse.json(content, {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch homepage content.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
