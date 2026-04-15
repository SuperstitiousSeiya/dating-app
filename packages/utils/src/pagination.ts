/**
 * Builds a cursor-paginated response slice from a data array.
 * The `cursor` field on each item must be a sortable, unique string (e.g., _id or ISO timestamp).
 *
 * @param data - Full result set from the DB query (fetch limit+1 to detect hasNextPage)
 * @param limit - Requested page size
 * @param getCursor - Function to extract cursor value from an item
 */
export function buildCursorPage<T>(
  data: T[],
  limit: number,
  getCursor: (item: T) => string,
): { items: T[]; nextCursor: string | null; hasNextPage: boolean } {
  const hasNextPage = data.length > limit;
  const items = hasNextPage ? data.slice(0, limit) : data;
  const lastItem = items[items.length - 1];
  const nextCursor = hasNextPage && lastItem ? getCursor(lastItem) : null;
  return { items, nextCursor, hasNextPage };
}

/**
 * Calculates offset-based pagination metadata.
 */
export function buildOffsetPage(
  total: number,
  page: number,
  limit: number,
): { skip: number; hasNextPage: boolean; totalPages: number } {
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  return { skip, hasNextPage, totalPages };
}
