import { NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
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
    const client = new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(projectId)
      .setSession(sessionSecret);

    const account = new Account(client);
    await account.get();
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
