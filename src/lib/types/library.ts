import { CUSTOM_COLLECTIONS } from "@/lib/constants/api";

type LibraryMediaType = "movie" | "series";

type LibraryFilterField = keyof typeof CUSTOM_COLLECTIONS.filter_field;
type LibrarySortField = keyof typeof CUSTOM_COLLECTIONS.sort_field;
type LibraryGroupBy = 0 | 1 | 2;
type LibraryOperator = 0 | 1 | 2 | 3 | 4;
type LibraryDirection = 0 | 1;

type LibraryBrowseQuery = {
  q: string;
  filterField?: LibraryFilterField;
  filterOperator?: LibraryOperator;
  filterValue?: string;
  sortField: LibrarySortField;
  sortDirection: LibraryDirection;
  groupBy?: LibraryGroupBy;
};

export type {
  LibraryBrowseQuery,
  LibraryDirection,
  LibraryFilterField,
  LibraryGroupBy,
  LibraryMediaType,
  LibraryOperator,
  LibrarySortField,
};
