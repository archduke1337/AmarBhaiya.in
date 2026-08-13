import type { Storage, TablesDB } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

export type DeleteTarget = { tableId: string; rowId: string };
export type FileDeleteGroup = { bucketId: string; fileIds: string[] };
export type DeletePlan = {
  stagedDeletes: DeleteTarget[];
  fileDeletes: FileDeleteGroup[];
};

async function stageDeleteTargets(
  tablesDB: TablesDB,
  transactionId: string,
  targets: DeleteTarget[]
): Promise<string[]> {
  const failedDeletes: string[] = [];

  for (const target of targets) {
    try {
      await tablesDB.deleteRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: target.tableId,
        rowId: target.rowId,
        transactionId,
      });
    } catch (error) {
      failedDeletes.push(`${target.tableId}/${target.rowId}`);
      console.error(
        `[Delete] Failed to stage delete for ${target.tableId}/${target.rowId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return failedDeletes;
}

async function deleteFileIds(
  storage: Storage,
  bucketId: string,
  fileIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(fileIds.map((fileId) => fileId.trim()).filter(Boolean))];

  for (const fileId of uniqueIds) {
    try {
      await storage.deleteFile({ bucketId, fileId });
    } catch (error) {
      console.error(
        `[Delete] Failed to delete file ${bucketId}/${fileId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

export function mergeDeletePlans(...plans: DeletePlan[]): DeletePlan {
  const stagedDeletes: DeleteTarget[] = [];
  const seenTargets = new Set<string>();
  const bucketFileIds = new Map<string, Set<string>>();

  for (const plan of plans) {
    for (const target of plan.stagedDeletes) {
      const key = `${target.tableId}/${target.rowId}`;
      if (seenTargets.has(key)) {
        continue;
      }

      seenTargets.add(key);
      stagedDeletes.push(target);
    }

    for (const fileDelete of plan.fileDeletes) {
      const bucketIds = bucketFileIds.get(fileDelete.bucketId) ?? new Set<string>();
      for (const fileId of fileDelete.fileIds.map((value) => value.trim()).filter(Boolean)) {
        bucketIds.add(fileId);
      }
      bucketFileIds.set(fileDelete.bucketId, bucketIds);
    }
  }

  return {
    stagedDeletes,
    fileDeletes: [...bucketFileIds.entries()].map(([bucketId, fileIds]) => ({
      bucketId,
      fileIds: [...fileIds],
    })),
  };
}

export async function executeDeletePlan({
  tablesDB,
  storage,
  plan,
  label,
}: {
  tablesDB: TablesDB;
  storage: Storage;
  plan: DeletePlan;
  label: string;
}): Promise<boolean> {
  const transaction = await tablesDB
    .createTransaction({
      ttl: 300,
    })
    .catch(() => null);

  if (!transaction?.$id) {
    console.error(`[Delete] Failed to create deletion transaction for ${label}.`);
    return false;
  }

  const failedDeletes = await stageDeleteTargets(
    tablesDB,
    transaction.$id,
    plan.stagedDeletes
  );

  if (failedDeletes.length > 0) {
    console.warn(
      `[Delete] ${label} was not deleted because transactional staging failed:`,
      failedDeletes
    );
    await tablesDB
      .updateTransaction({
        transactionId: transaction.$id,
        rollback: true,
      })
      .catch(() => null);
    return false;
  }

  try {
    await tablesDB.updateTransaction({
      transactionId: transaction.$id,
      commit: true,
    });
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : `Failed to commit deletion for ${label}.`
    );
    await tablesDB
      .updateTransaction({
        transactionId: transaction.$id,
        rollback: true,
      })
      .catch(() => null);
    return false;
  }

  for (const fileDelete of plan.fileDeletes) {
    await deleteFileIds(storage, fileDelete.bucketId, fileDelete.fileIds);
  }

  return true;
}
