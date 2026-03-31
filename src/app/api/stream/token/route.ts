import { NextResponse } from "next/server";

import { createSessionClient } from "@/lib/appwrite/server";
import { generateStreamToken, upsertStreamUser } from "@/lib/stream/client";

export const runtime = "nodejs";

async function getAuthenticatedUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await upsertStreamUser({
      id: user.$id,
      name: user.name,
      image: undefined,
    });

    const token = generateStreamToken(user.$id);

    return NextResponse.json({
      userId: user.$id,
      token,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Stream token.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
