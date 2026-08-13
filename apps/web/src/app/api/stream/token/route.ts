import { NextResponse } from "next/server";

import { createSessionClient } from "@/lib/appwrite/server";
import { createStreamUserToken, ensureStreamUser } from "@/lib/stream/client";

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
    await ensureStreamUser({
      id: user.$id,
      name: user.name,
      image: undefined,
    });

    const token = createStreamUserToken(user.$id);

    return NextResponse.json({
      userId: user.$id,
      token,
    });
  } catch (error) {
    console.error("[Stream Token API]", error);
    return NextResponse.json(
      { error: "Failed to create Stream token." },
      { status: 500 }
    );
  }
}
