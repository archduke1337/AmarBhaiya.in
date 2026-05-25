import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

export async function GET(request: Request) {
  const projectId = APPWRITE_CONFIG.projectId;
  const sessionCookieName = `a_session_${projectId}`;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${sessionCookieName}=([^;]*)`));
  const sessionSecret = match?.[1] ?? "";

  if (!sessionSecret) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const { account } = await createAdminClient();
    await account.get({ session: sessionSecret });
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
