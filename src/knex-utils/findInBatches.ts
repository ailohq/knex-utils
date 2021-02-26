import { QueryBuilder } from "knex";

/**
 * Returns an iterable of all rows, that will be fetched from db in bulks consisting of `batchSize` rows.
 * Results need to contain a field named after the `orderBy` argument (`"id"` by default), by which the rows will be ordered.
 *
 * @example
 * ```ts
 * const usersQuery = knex("users").select("id");
 * for await (const user of findInBatches(usersQuery)) {
 *   // ...
 * }
 * ```
 */
export function findInBatches<TRecord, TResult>(
  query: QueryBuilder<TRecord, TResult>,
  {
    batchSize = 500,
    orderBy: idField = "id",
  }: {
    batchSize?: number;
    /**
     * The field by which results will be ordered, so that no result is yielded twice.
     * Each result needs to contain that field.
     * @default "id"
     */
    orderBy?: string;
  } = {}
): AsyncIterable<TResult> {
  let lastId: string | undefined;
  let hasMore = true;
  let rowsToYield: TResult[] = [];

  const fetchNextPage = async (): Promise<void> => {
    const pageQuery = query.clone().limit(batchSize);
    if (lastId) {
      void pageQuery.where(idField, ">", lastId);
    }
    const rows = (await pageQuery) as TResult[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastId = (rows[rows.length - 1] as any)?.[idField];
    hasMore = rows.length > 0;
    rowsToYield = rows;
  };

  const iterator: AsyncIterable<TResult> = {
    [Symbol.asyncIterator]: () => {
      return {
        next: async () => {
          if (rowsToYield.length === 0 && !hasMore) {
            return { done: true, value: undefined };
          }

          if (rowsToYield.length === 0) {
            await fetchNextPage();
          }

          if (rowsToYield.length > 0) {
            const value = rowsToYield.shift()!;
            return { done: false, value };
          }

          return { done: true, value: undefined };
        },
      };
    },
  };

  return iterator;
}
