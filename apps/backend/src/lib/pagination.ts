import type { FilterQuery, Model, SortOrder } from "mongoose";

import { buildCursorPage } from "@dating-app/utils";

export type CursorPageOptions = {
  cursor?: string;
  limit: number;
  sortField?: string;
  sortOrder?: SortOrder;
};

export type CursorPageResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

/**
 * Generic MongoDB cursor pagination helper.
 * Fetches `limit + 1` documents to determine `hasNextPage`.
 *
 * @param model - Mongoose model to query
 * @param filter - Base query filter (without cursor condition)
 * @param options - Pagination options
 * @param getCursor - Function to extract a sortable string cursor from a document
 */
export async function paginateWithCursor<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: CursorPageOptions,
  getCursor: (doc: T) => string,
): Promise<CursorPageResult<T>> {
  const { cursor, limit, sortField = "_id", sortOrder = -1 } = options;

  const query: FilterQuery<T> = { ...filter };

  if (cursor) {
    const operator = sortOrder === -1 ? "$lt" : "$gt";
    query[sortField as keyof FilterQuery<T>] = { [operator]: cursor } as FilterQuery<T>[keyof FilterQuery<T>];
  }

  const docs = await model
    .find(query)
    .sort({ [sortField]: sortOrder })
    .limit(limit + 1)
    .lean<T[]>()
    .exec();

  return buildCursorPage(docs, limit, getCursor);
}
