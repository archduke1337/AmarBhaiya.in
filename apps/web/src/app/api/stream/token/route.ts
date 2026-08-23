import { NextResponse } from "next/server";

import { createStreamUserToken, ensureStreamUser } from "@/server/stream/client";

import { getApiUser } from "@/server/appwrite/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getApiUser();

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
