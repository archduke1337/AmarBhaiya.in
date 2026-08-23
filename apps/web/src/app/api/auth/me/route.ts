import { NextResponse } from "next/server";
import { createSessionClient } from "@/server/appwrite/server";

export async function GET() {
  try {
    const { account } = await createSessionClient();
    await account.get();
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
