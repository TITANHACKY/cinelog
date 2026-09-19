import type { CustomCollectionWithFilters } from "@/lib/types";
import type {
  LibraryFilterClause,
  LibraryQueryInput,
} from "@/lib/validations/library";

export function collectionToLibraryQuery(
  collection: CustomCollectionWithFilters,
  options?: {
    offset?: number;
    limit?: number;
    q?: string;
    groupKey?: string;
  },
): LibraryQueryInput {
  const sort = collection.sorts?.[0];
  const mediaType = collection.mediaType === 0 ? "movie" : "series";

  const query: LibraryQueryInput = {
    type: mediaType,
    offset: options?.offset ?? 0,
    limit: options?.limit ?? 15,
    sort_field: (sort?.field as LibraryQueryInput["sort_field"]) ?? "created_at",
    sort_direction: (sort?.direction as 0 | 1) ?? 1,
  };

  const q = options?.q?.trim();
  if (q) {
    query.q = q;
  }

  if (collection.filters.length > 0) {
    query.filters = collection.filters.map(
      (filter): LibraryFilterClause => ({
        field: filter.field as LibraryFilterClause["field"],
        operator: filter.operator as LibraryFilterClause["operator"],
        value: filter.value,
      }),
    );
  }

  if (collection.groupBy !== null && collection.groupBy !== undefined) {
    query.group_by = collection.groupBy as 0 | 1 | 2;
  }

  if (options?.groupKey && query.group_by !== undefined) {
    query.group_key = options.groupKey;
  }

  return query;
}
