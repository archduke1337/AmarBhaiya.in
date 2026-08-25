import type { Models } from "node-appwrite";

export type AnyRow = Models.Row & Record<string, unknown>;
export type BaseRow = Models.Row;
export type StrictRow<T> = BaseRow & T;