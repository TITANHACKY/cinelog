import {
  IMPRESSION,
  LIBRARY_PAGE_SIZE,
  MOVIE_STATUS,
  SERIES_STATUS,
  WATCH_STATUS,
} from "@/lib/constants";
import { toMovieStatusDisplay, toSeriesStatusDisplay } from "@/lib/media/status";
import type {
  LibraryBrowseQuery,
  LibraryGroup,
  LibraryGroupBy,
  LibraryMediaType,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";

export function browseQueriesEqual(
  left: LibraryBrowseQuery,
  right: LibraryBrowseQuery,
) {
  return (
    left.q.trim() === right.q.trim() &&
    left.filterField === right.filterField &&
    left.filterOperator === right.filterOperator &&
    left.filterValue === right.filterValue &&
    left.sortField === right.sortField &&
    left.sortDirection === right.sortDirection &&
    left.groupBy === right.groupBy
  );
}

export function toLibrarySearchParams(
  type: LibraryMediaType,
  offset: number,
  limit: number,
  query: LibraryBrowseQuery,
  groupKey?: string,
) {
  const params = new URLSearchParams({
    type,
    offset: String(offset),
    limit: String(limit || LIBRARY_PAGE_SIZE),
    sort_field: query.sortField,
    sort_direction: String(query.sortDirection),
  });

  const q = query.q.trim();
  if (q) {
    params.set("q", q);
  }

  if (
    query.filterField &&
    query.filterOperator !== undefined &&
    query.filterValue
  ) {
    params.set("filter_field", query.filterField);
    params.set("filter_operator", String(query.filterOperator));
    params.set("filter_value", query.filterValue);
  }

  if (query.groupBy !== undefined) {
    params.set("group_by", String(query.groupBy));
  }

  if (groupKey && query.groupBy !== undefined) {
    params.set("group_key", groupKey);
  }

  return params;
}

export function libraryImpressionGroupKey(impression: number | null) {
  return impression === null ? "none" : String(impression);
}

const IMPRESSION_GROUP_LABELS: Record<string, string> = {
  none: "No Impression",
  "0": IMPRESSION[0].display_value,
  "1": IMPRESSION[1].display_value,
  "2": IMPRESSION[2].display_value,
};

export function libraryImpressionGroupLabel(key: string) {
  return IMPRESSION_GROUP_LABELS[key] ?? key;
}

export function compareImpressionGroupKeys(left: string, right: string) {
  const order: Record<string, number> = {
    "2": 0,
    "1": 1,
    "0": 2,
    none: 3,
  };

  return (order[left] ?? 99) - (order[right] ?? 99);
}

export function libraryGroupKey(
  item: LibraryMovie | LibrarySeries,
  groupBy: LibraryGroupBy,
) {
  if (groupBy === 0) {
    return String(item.watch_status);
  }

  if (groupBy === 1) {
    return libraryImpressionGroupKey(item.impression);
  }

  return item.status || "Unknown";
}

export function libraryGroupLabel(
  groupBy: LibraryGroupBy,
  key: string,
  mediaType: LibraryMediaType,
) {
  if (!key || key === "Unknown") {
    return "Unknown";
  }

  if (groupBy === 0) {
    const status = Number(key);
    return WATCH_STATUS[status as keyof typeof WATCH_STATUS]?.display_value ?? key;
  }

  if (groupBy === 1) {
    return libraryImpressionGroupLabel(key);
  }

  if (mediaType === "movie") {
    return toMovieStatusDisplay(key) ?? key;
  }

  return toSeriesStatusDisplay(key) ?? key;
}

export function mapLibraryGroups(
  rows: Array<{ key: string; value: number }> | undefined,
  groupBy: LibraryGroupBy | undefined,
  mediaType: LibraryMediaType,
): LibraryGroup[] | undefined {
  if (groupBy === undefined || !rows) {
    return undefined;
  }

  const mapped = rows.map((row) => ({
    key: String(row.key),
    label: libraryGroupLabel(groupBy, String(row.key), mediaType),
    count: Number(row.value),
  }));

  if (groupBy === 1) {
    return [...mapped].sort((left, right) =>
      compareImpressionGroupKeys(left.key, right.key),
    );
  }

  return mapped;
}

export function withGroupHasMore(
  groups: LibraryGroup[] | undefined,
  items: Array<LibraryMovie | LibrarySeries>,
  groupBy: LibraryGroupBy | undefined,
  mediaType: LibraryMediaType,
  options?: { groupKey?: string; offset?: number },
): LibraryGroup[] | undefined {
  if (!groups || groupBy === undefined) {
    return groups;
  }

  const loadedByKey = new Map<string, number>();
  for (const item of items) {
    const key = libraryGroupKey(item, groupBy);
    loadedByKey.set(key, (loadedByKey.get(key) ?? 0) + 1);
  }

  return groups.map((group) => {
    const loaded = loadedByKey.get(group.key) ?? 0;
    const offset = options?.groupKey === group.key ? (options.offset ?? 0) : 0;
    return {
      ...group,
      hasMore: offset + loaded < group.count,
    };
  });
}

export function defaultFilterValue(
  field: LibraryBrowseQuery["filterField"],
  mediaType: LibraryMediaType,
) {
  switch (field) {
    case "watch_status":
      return String(WATCH_STATUS[0].value);
    case "impression":
      return String(IMPRESSION[1].value);
    case "vote_average":
      return "7";
    case "release_year":
      return String(new Date().getFullYear());
    case "status":
      return mediaType === "movie"
        ? MOVIE_STATUS.released.value
        : SERIES_STATUS.returning_series.value;
    case "genre":
      return "Action";
    case "original_language":
      return "en";
    case "origin_country":
      return "US";
    default:
      return "";
  }
}
