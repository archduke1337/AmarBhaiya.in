import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { z } from "zod";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { createPhonePeOrder } from "@/lib/payments/phonepe";

export const runtime = "nodejs";

const createOrderSchema = z.object({
  courseId: z.string().min(1),
  amount: z.number().int().positive(),
  redirectPath: z.string().optional(),
});

async function getAuthenticatedUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

function getSafeRedirectPath(pathValue: string | undefined): string {
  if (!pathValue || !pathValue.startsWith("/") || pathValue.startsWith("//")) {
    return "/app/dashboard";
  }

  return pathValue;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
    const merchantTransactionId = `pp_${Date.now()}_${ID.unique().slice(0, 8)}`;

    const phonePeResult = await createPhonePeOrder({
      amount: parsed.data.amount,
      merchantTransactionId,
      merchantUserId: user.$id,
      redirectUrl: `${appUrl}${getSafeRedirectPath(parsed.data.redirectPath)}`,
      callbackUrl: `${appUrl}/api/payments/phonepe/webhook`,
    });

    const providerRef = phonePeResult.merchantTransactionId;
    const redirectUrl =
      phonePeResult.response.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
      throw new Error("PhonePe redirect URL missing in order response.");
    }

    const paymentId = ID.unique();
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      data: {
        userId: user.$id,
        courseId: parsed.data.courseId,
        amount: parsed.data.amount,
        currency: "INR",
        method: "phonepe",
        status: "pending",
        providerRef,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      paymentId,
      providerRef,
      redirectUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create PhonePe order.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
