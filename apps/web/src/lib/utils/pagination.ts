/**
 * Pagination helper to prevent querying too many records at once
 * Appwrite has a 2000 record limit, so we need pagination for large datasets
 */

export type PaginationParams = {
  page: number;
  pageSize?: number;
  offset?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
};

/**
 * Calculate offset from page number
 */
export function getOffset(page: number, pageSize: number = 20): number {
  return (page - 1) * pageSize;
}

/**
 * Calculate pagination info
 */
export function getPaginationInfo<T = unknown>(
  total: number,
  page: number,
  pageSize: number = 20
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;

  return {
    items: [],
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage,
  };
}

/**
 * Build Appwrite queries with offset and limit
 */
export function buildPaginationQueries(page: number, pageSize: number = 20) {
  const offset = getOffset(page, pageSize);
  return { offset, limit: pageSize };
}

