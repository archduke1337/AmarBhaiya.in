import { Query } from "node-appwrite";
import type { Models, TablesDB } from "node-appwrite";

import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

export type AnyAppwriteRow = Models.Row & Record<string, unknown>;

function chunkValues<T>(values: T[], chunkSize: number): T[][] {
  if (values.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function listAllRows<Row extends AnyAppwriteRow>(
  tablesDB: TablesDB,
  tableId: string,
  queries: string[] = [],
  pageSize = 500
): Promise<Row[]> {
  const rows: Row[] = [];
  let offset = 0;

  while (true) {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId,
      queries: [...queries, Query.limit(pageSize), Query.offset(offset)],
    });

    rows.push(...(result.rows as unknown as Row[]));

    if (result.rows.length < pageSize) {
      break;
    }

    offset += result.rows.length;
  }

  return rows;
}

export async function listRowsByFieldValues<Row extends AnyAppwriteRow>(
  tablesDB: TablesDB,
  tableId: string,
  field: string,
  values: string[],
  options?: {
    chunkSize?: number;
    pageSize?: number;
    queries?: string[];
  }
): Promise<Row[]> {
  if (values.length === 0) {
    return [];
  }

  const chunkSize = options?.chunkSize ?? 20;
  const pageSize = options?.pageSize ?? 100;
  const baseQueries = options?.queries ?? [];
  const rows: Row[] = [];

  for (const chunk of chunkValues(values, chunkSize)) {
    const chunkRows = await listAllRows<Row>(
      tablesDB,
      tableId,
      [...baseQueries, Query.equal(field, chunk)],
      pageSize
    );
    rows.push(...chunkRows);
  }

  return rows;
}
