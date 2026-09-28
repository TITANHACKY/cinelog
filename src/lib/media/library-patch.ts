import { LIBRARY_PAGE_SIZE } from "@/lib/constants";
import { apiFetch } from "@/lib/http/client";
import { appendUnique } from "@/lib/media/library-items";
import {
  libraryGroupKey,
  libraryGroupLabel,
  libraryImpressionGroupKey,
  libraryImpressionGroupLabel,
  toLibrarySearchParams,
} from "@/lib/media/library-browse";
import type {
  LibraryBrowseQuery,
  LibraryGroup,
  LibraryGroupBy,
  LibraryMediaType,
  LibraryMetadata,
  LibraryMovie,
  LibrarySeries,
  LibrarySeriesSeason,
  SmartCollectionWithFilters,
} from "@/lib/types";
import type { DashboardData } from "@/services/dashboard";

export type SeriesProgressFields = {
  watch_status: number | null;
  impression: number | null;
  total_number_of_episodes_watched: number;
  total_number_of_seasons_watched: number;
  seasons: Array<{
    season_number: number;
    episode_count: number;
    episodes_watched: number;
  }>;
};

export type LibraryChange = {
  mediaType: LibraryMediaType;
  tmdbId: number;
  watch_status?: number;
  impression?: number | null;
  remove?: boolean;
  seriesUpdate?: SeriesProgressFields;
};

export type LibraryGroupPage = {
  items: Array<LibraryMovie | LibrarySeries>;
  hasMore: boolean;
  loadingMore: boolean;
};

export type LibraryViewData = {
  kind: "library-view";
  mediaType: LibraryMediaType;
  groupBy: LibraryGroupBy | null;
  items: Array<LibraryMovie | LibrarySeries>;
  groups?: LibraryGroup[];
  groupPages: Record<string, LibraryGroupPage>;
  movieCount: number;
  seriesCount: number;
  hasMore: boolean;
  collection: SmartCollectionWithFilters | null;
};

export type LibraryApiPayload = {
  movies: LibraryMovie[];
  series: LibrarySeries[];
  metadata: LibraryMetadata;
  collection?: SmartCollectionWithFilters;
};

export type CarouselPage = {
  movies: LibraryMovie[];
  series: LibrarySeries[];
  metadata: LibraryMetadata;
};

export async function fetchLibraryPayload(
  mediaType: LibraryMediaType,
  query: LibraryBrowseQuery,
  offset: number,
  groupKey?: string,
) {
  const params = toLibrarySearchParams(
    mediaType,
    offset,
    LIBRARY_PAGE_SIZE,
    query,
    groupKey,
  );
  const response = await apiFetch(`/api/library?${params.toString()}`);
  const data = (await response.json()) as LibraryApiPayload & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Failed to load library");
  }
  return data;
}

export async function fetchCollectionPayload(
  collectionId: number,
  search: string,
  offset: number,
  groupKey?: string,
) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(LIBRARY_PAGE_SIZE),
  });
  const q = search.trim();
  if (q) params.set("q", q);
  if (groupKey) params.set("group_key", groupKey);

  const response = await apiFetch(
    `/api/collections/${collectionId}/items?${params.toString()}`,
  );
  const json = (await response.json()) as LibraryApiPayload & { error?: string };
  if (!response.ok) {
    throw new Error(json.error || "Failed to load collection items");
  }
  return (json as { data?: LibraryApiPayload }).data ?? json;
}

export function libraryViewFromPayload(
  mediaType: LibraryMediaType,
  groupBy: LibraryGroupBy | null | undefined,
  payload: LibraryApiPayload,
  collection: SmartCollectionWithFilters | null = payload.collection ?? null,
): LibraryViewData {
  const items = mediaType === "movie" ? payload.movies : payload.series;
  const resolvedGroupBy = groupBy ?? null;
  const groups = payload.metadata.groups;
  return {
    kind: "library-view",
    mediaType,
    groupBy: resolvedGroupBy,
    items,
    groups,
    groupPages: buildGroupPages(items, groups, resolvedGroupBy ?? undefined),
    movieCount: payload.metadata.count.movies,
    seriesCount: payload.metadata.count.series,
    hasMore: payload.metadata.hasMore,
    collection,
  };
}

export function appendLibraryPage(
  current: LibraryViewData,
  payload: LibraryApiPayload,
) {
  const pageItems =
    current.mediaType === "movie" ? payload.movies : payload.series;
  return {
    ...current,
    items: appendUnique(current.items, pageItems),
    movieCount: payload.metadata.count.movies,
    seriesCount: payload.metadata.count.series,
    hasMore: payload.metadata.hasMore,
  };
}

export function appendLibraryGroupPage(
  current: LibraryViewData,
  groupKey: string,
  payload: LibraryApiPayload,
) {
  const pageItems =
    current.mediaType === "movie" ? payload.movies : payload.series;
  const page = current.groupPages[groupKey];
  const items = appendUnique(page?.items ?? [], pageItems);
  return {
    ...current,
    items: appendUnique(current.items, pageItems),
    groupPages: {
      ...current.groupPages,
      [groupKey]: {
        items,
        hasMore: payload.metadata.hasMore,
        loadingMore: false,
      },
    },
  };
}

export function setGroupLoading(
  current: LibraryViewData,
  groupKey: string,
  loadingMore: boolean,
) {
  const page = current.groupPages[groupKey];
  if (!page) return current;
  return {
    ...current,
    groupPages: {
      ...current.groupPages,
      [groupKey]: { ...page, loadingMore },
    },
  };
}

function buildGroupPages(
  items: Array<LibraryMovie | LibrarySeries>,
  groups: LibraryGroup[] | undefined,
  groupBy: LibraryGroupBy | undefined,
  previous?: Record<string, LibraryGroupPage>,
) {
  if (groupBy === undefined || !groups?.length) {
    return {};
  }

  const pages: Record<string, LibraryGroupPage> = {};
  for (const group of groups) {
    const groupItems = items.filter(
      (item) => libraryGroupKey(item, groupBy) === group.key,
    );
    const prev = previous?.[group.key];
    pages[group.key] = {
      items: groupItems,
      hasMore: prev?.hasMore ?? group.hasMore ?? groupItems.length < group.count,
      loadingMore: false,
    };
  }
  return pages;
}

function applySeriesProgress(
  item: LibrarySeries,
  update: SeriesProgressFields,
): LibrarySeries {
  const airDateBySeason = new Map(
    item.seasons_info.map((season) => [season.season_number, season.air_date]),
  );
  return {
    ...item,
    watch_status: update.watch_status ?? item.watch_status,
    impression: update.impression,
    total_number_of_episodes_watched: update.total_number_of_episodes_watched,
    total_number_of_seasons_watched: update.total_number_of_seasons_watched,
    seasons_info: update.seasons.map(
      (season): LibrarySeriesSeason => ({
        season_number: season.season_number,
        episode_count: season.episode_count,
        episodes_watched: season.episodes_watched,
        air_date: airDateBySeason.get(season.season_number) ?? null,
      }),
    ),
  };
}

function applyItemChange<T extends LibraryMovie | LibrarySeries>(
  item: T,
  change: LibraryChange,
): T {
  if (change.seriesUpdate && "seasons_info" in item) {
    return applySeriesProgress(item, change.seriesUpdate) as T;
  }

  const next = { ...item };
  if (change.watch_status !== undefined) {
    next.watch_status = change.watch_status;
  }
  if (change.impression !== undefined) {
    next.impression = change.impression;
  }
  return next;
}

function updateWatchStatusGroups(
  groups: LibraryGroup[] | undefined,
  fromKey: string,
  toKey: string,
  mediaType: LibraryMediaType,
) {
  if (fromKey === toKey) return groups;
  const next = groups ? groups.map((group) => ({ ...group })) : [];
  const fromGroup = next.find((group) => group.key === fromKey);
  if (fromGroup) fromGroup.count = Math.max(0, fromGroup.count - 1);
  const toGroup = next.find((group) => group.key === toKey);
  if (toGroup) {
    toGroup.count += 1;
  } else {
    next.push({
      key: toKey,
      label: libraryGroupLabel(0, toKey, mediaType),
      count: 1,
      hasMore: false,
    });
  }
  return next
    .filter((group) => group.count > 0)
    .sort((left, right) => Number(left.key) - Number(right.key));
}

function updateImpressionGroups(
  groups: LibraryGroup[] | undefined,
  fromKey: string,
  toKey: string,
) {
  if (fromKey === toKey) return groups;
  const next = groups ? groups.map((group) => ({ ...group })) : [];
  const fromGroup = next.find((group) => group.key === fromKey);
  if (fromGroup) fromGroup.count = Math.max(0, fromGroup.count - 1);
  const toGroup = next.find((group) => group.key === toKey);
  if (toGroup) {
    toGroup.count += 1;
  } else {
    next.push({
      key: toKey,
      label: libraryImpressionGroupLabel(toKey),
      count: 1,
      hasMore: false,
    });
  }
  return next.filter((group) => group.count > 0);
}

function compareImpressionKeys(left: string, right: string) {
  const order: Record<string, number> = { "2": 0, "1": 1, "0": 2, none: 3 };
  return (order[left] ?? 99) - (order[right] ?? 99);
}

export function patchLibraryView(data: LibraryViewData, change: LibraryChange) {
  if (data.mediaType !== change.mediaType) {
    if (!change.remove) return data;
    return {
      ...data,
      movieCount:
        change.mediaType === "movie"
          ? Math.max(0, data.movieCount - 1)
          : data.movieCount,
      seriesCount:
        change.mediaType === "series"
          ? Math.max(0, data.seriesCount - 1)
          : data.seriesCount,
    };
  }

  const index = data.items.findIndex((item) => item.tmdb_id === change.tmdbId);
  if (index === -1) return data;

  if (change.remove) {
    const removed = data.items[index];
    const groupBy = data.groupBy ?? undefined;
    let groups = data.groups;
    if (groupBy !== undefined && removed) {
      const key = libraryGroupKey(removed, groupBy);
      groups = (groups ?? [])
        .map((group) =>
          group.key === key
            ? { ...group, count: Math.max(0, group.count - 1) }
            : group,
        )
        .filter((group) => group.count > 0);
    }
    const items = data.items.filter((item) => item.tmdb_id !== change.tmdbId);
    return {
      ...data,
      items,
      groups,
      groupPages: buildGroupPages(items, groups, groupBy, data.groupPages),
      movieCount:
        change.mediaType === "movie"
          ? Math.max(0, data.movieCount - 1)
          : data.movieCount,
      seriesCount:
        change.mediaType === "series"
          ? Math.max(0, data.seriesCount - 1)
          : data.seriesCount,
    };
  }

  const previous = data.items[index];
  const nextItem = applyItemChange(previous, change);
  const items = data.items.slice();
  items[index] = nextItem;

  let groups = data.groups;
  const groupBy = data.groupBy ?? undefined;
  if (
    groupBy === 0 &&
    previous.watch_status !== nextItem.watch_status
  ) {
    groups = updateWatchStatusGroups(
      groups,
      String(previous.watch_status),
      String(nextItem.watch_status),
      data.mediaType,
    );
  }
  if (groupBy === 1 && previous.impression !== nextItem.impression) {
    const fromKey = libraryImpressionGroupKey(previous.impression);
    const toKey = libraryImpressionGroupKey(nextItem.impression);
    const nextGroups = updateImpressionGroups(groups, fromKey, toKey) ?? [];
    groups = [...nextGroups].sort((left, right) =>
      compareImpressionKeys(left.key, right.key),
    );
  }

  return {
    ...data,
    items,
    groups,
    groupPages:
      groupBy === undefined
        ? data.groupPages
        : buildGroupPages(items, groups, groupBy, data.groupPages),
  };
}

function patchItemList<T extends LibraryMovie | LibrarySeries>(
  items: T[],
  change: LibraryChange,
) {
  const index = items.findIndex((item) => item.tmdb_id === change.tmdbId);
  if (index === -1) return { items, found: false };
  if (change.remove) {
    return {
      items: items.filter((item) => item.tmdb_id !== change.tmdbId),
      found: true,
    };
  }
  const next = items.slice();
  next[index] = applyItemChange(items[index], change);
  return { items: next, found: true };
}

export function patchCarouselPage(page: CarouselPage, change: LibraryChange) {
  const moviePatch = patchItemList(page.movies, change);
  const seriesPatch = patchItemList(page.series, change);
  const found = moviePatch.found || seriesPatch.found;
  if (!found) return { page, found: false };
  const count = { ...page.metadata.count };
  if (change.remove && change.mediaType === "movie" && moviePatch.found) {
    count.movies = Math.max(0, count.movies - 1);
  }
  if (change.remove && change.mediaType === "series" && seriesPatch.found) {
    count.series = Math.max(0, count.series - 1);
  }
  return {
    found: true,
    page: {
      ...page,
      movies: moviePatch.items,
      series: seriesPatch.items,
      metadata: { ...page.metadata, count },
    },
  };
}

export function patchDashboard(data: DashboardData, change: LibraryChange): DashboardData {
  const collections = data.collections.map((collection) => {
    const movies = patchItemList(collection.preview.movies, change);
    const series = patchItemList(collection.preview.series, change);
    const count = { ...collection.preview.metadata.count };
    if (change.remove && movies.found && change.mediaType === "movie") {
      count.movies = Math.max(0, count.movies - 1);
    }
    if (change.remove && series.found && change.mediaType === "series") {
      count.series = Math.max(0, count.series - 1);
    }
    return {
      ...collection,
      preview: {
        ...collection.preview,
        movies: movies.items,
        series: series.items,
        metadata: { ...collection.preview.metadata, count },
      },
    };
  });

  let continueWatching = data.continueWatching ?? [];
  if (change.remove) {
    continueWatching = continueWatching.filter((item) => {
      const isMovie = "title" in item;
      const mediaMatch = change.mediaType === (isMovie ? "movie" : "series");
      return !(mediaMatch && item.tmdb_id === change.tmdbId);
    });
  } else if (change.watch_status !== undefined && change.watch_status !== 1) {
    continueWatching = continueWatching.filter((item) => {
      const isMovie = "title" in item;
      const mediaMatch = change.mediaType === (isMovie ? "movie" : "series");
      return !(mediaMatch && item.tmdb_id === change.tmdbId);
    });
  } else if (
    change.seriesUpdate?.watch_status !== undefined &&
    change.seriesUpdate.watch_status !== 1
  ) {
    continueWatching = continueWatching.filter((item) => {
      const isMovie = "title" in item;
      return !(change.mediaType === "series" && !isMovie && item.tmdb_id === change.tmdbId);
    });
  } else {
    continueWatching = continueWatching.map((item) => {
      const isMovie = "title" in item;
      if (change.mediaType === (isMovie ? "movie" : "series") && item.tmdb_id === change.tmdbId) {
        if (!isMovie && change.seriesUpdate) {
          const seriesItem = item as LibrarySeries;
          const updatedSeasons = (seriesItem.seasons_info ?? []).map((s) => {
            const match = change.seriesUpdate?.seasons.find(
              (u) => u.season_number === s.season_number,
            );
            return match ? { ...s, episodes_watched: match.episodes_watched } : s;
          });
          return {
            ...seriesItem,
            watch_status: change.seriesUpdate.watch_status ?? seriesItem.watch_status,
            impression: change.seriesUpdate.impression ?? seriesItem.impression,
            total_number_of_episodes_watched:
              change.seriesUpdate.total_number_of_episodes_watched,
            total_number_of_seasons_watched:
              change.seriesUpdate.total_number_of_seasons_watched,
            seasons_info: updatedSeasons,
            last_watched_at: String(Math.floor(Date.now() / 1000)),
          };
        }
        if (change.watch_status !== undefined) {
          return {
            ...item,
            watch_status: change.watch_status,
            last_watched_at: String(Math.floor(Date.now() / 1000)),
          };
        }
      }
      return item;
    });
  }

  return {
    ...data,
    collections,
    continueWatching,
    counts: change.remove
      ? {
          movies:
            change.mediaType === "movie"
              ? Math.max(0, data.counts.movies - 1)
              : data.counts.movies,
          series:
            change.mediaType === "series"
              ? Math.max(0, data.counts.series - 1)
              : data.counts.series,
        }
      : data.counts,
  };
}

