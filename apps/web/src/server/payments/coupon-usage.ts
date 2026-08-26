import { Query } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/server/appwrite/config";
import type { createAdminClient } from "@/server/appwrite/server";

type TablesDbClient = Awaited<ReturnType<typeof createAdminClient>>["tablesDB"];

type PaymentLike = {
  $id: string;
  couponUsageRecorded?: unknown;
};

/**
 * Records one successful coupon redemption for a local payment.
 * The payment marker and coupon counter are committed together so a retry
 * cannot count the same payment twice.
 */
export async function recordCouponUsageForPayment(
  tablesDB: TablesDbClient,
  {
    paymentId,
    couponCode,
  }: {
    paymentId: string;
    couponCode: string;
  }
): Promise<boolean> {
  const normalizedCode = couponCode.trim().toUpperCase();
  if (!paymentId || !normalizedCode) {
    return false;
  }

  const transaction = await tablesDB.createTransaction({ ttl: 30 });
  try {
    const payment = (await tablesDB.getRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      transactionId: transaction.$id,
    }).catch(() => null)) as PaymentLike | null;

    if (!payment || payment.couponUsageRecorded === true || payment.couponUsageRecorded === "true") {
      await tablesDB.updateTransaction({ transactionId: transaction.$id, rollback: true });
      return false;
    }

    const couponResult = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      queries: [Query.equal("code", [normalizedCode]), Query.limit(1)],
      transactionId: transaction.$id,
    });
    const coupon = couponResult.rows[0];
    if (!coupon) {
      await tablesDB.updateTransaction({ transactionId: transaction.$id, rollback: true });
      return false;
    }

    const usedCount = Number(coupon.usedCount ?? 0);
    const maxUses = Number(coupon.maxUses ?? 0);
    if (!Number.isFinite(usedCount) || !Number.isFinite(maxUses) || usedCount >= maxUses) {
      await tablesDB.updateTransaction({ transactionId: transaction.$id, rollback: true });
      return false;
    }
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.coupons,
      rowId: coupon.$id,
      transactionId: transaction.$id,
      data: { usedCount: usedCount + 1 },
    });
    await tablesDB.updateRow({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.payments,
      rowId: paymentId,
      transactionId: transaction.$id,
      data: { couponUsageRecorded: true },
    });
    await tablesDB.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    });
    return true;
  } catch (error) {
    await tablesDB
      .updateTransaction({
        transactionId: transaction.$id,
        rollback: true,
      })
      .catch(() => undefined);
    throw error;
  }
}
