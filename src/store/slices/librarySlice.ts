import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DEFAULT_LIBRARY_BROWSE_QUERY } from "@/lib/constants";
import {
  compareImpressionGroupKeys,
  libraryGroupKey,
  libraryGroupLabel,
  libraryImpressionGroupKey,
  libraryImpressionGroupLabel,
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
} from "@/lib/types";

export type { LibraryMediaType };

export type LibraryStatus = "idle" | "loading" | "succeeded" | "failed";

export type LibraryGroupPage<T extends LibraryMovie | LibrarySeries> = {
  items: T[];
  hasMore: boolean;
  loadingMore: boolean;
};

export type LibraryItemMutation = {
  tmdbId: number;
  mediaType: LibraryMediaType;
  watch_status?: number;
  impression?: number | null;
  progress?: {
    seasonNumber: number;
    episodeNumber: number;
  };
};

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

type LibraryItemSnapshot = {
  watch_status: number;
  impression: number | null;
  pendingType?: "watch_status" | "impression" | "progress";
};

export type LibraryState = {
  movies: LibraryMovie[];
  series: LibrarySeries[];
  movieCount: number;
  seriesCount: number;
  moviesHasMore: boolean;
  seriesHasMore: boolean;
  moviesLoaded: boolean;
  seriesLoaded: boolean;
  moviesLoadingMore: boolean;
  seriesLoadingMore: boolean;
  movieGroups: LibraryGroup[] | undefined;
  seriesGroups: LibraryGroup[] | undefined;
  movieGroupPages: Record<string, LibraryGroupPage<LibraryMovie>>;
  seriesGroupPages: Record<string, LibraryGroupPage<LibrarySeries>>;
  query: LibraryBrowseQuery;
  queryNonce: number;
  selectedCollectionId: number | null;
  status: LibraryStatus;
  error: string | null;
  /** Pre-mutation values for in-flight items, keyed by `libraryItemKey`. */
  pending: Record<string, LibraryItemSnapshot>;
};

const initialState: LibraryState = {
  movies: [],
  series: [],
  movieCount: 0,
  seriesCount: 0,
  moviesHasMore: false,
  seriesHasMore: false,
  moviesLoaded: false,
  seriesLoaded: false,
  moviesLoadingMore: false,
  seriesLoadingMore: false,
  movieGroups: undefined,
  seriesGroups: undefined,
  movieGroupPages: {},
  seriesGroupPages: {},
  query: DEFAULT_LIBRARY_BROWSE_QUERY,
  queryNonce: 0,
  selectedCollectionId: null,
  status: "idle",
  error: null,
  pending: {},
};

export function libraryItemKey(mediaType: LibraryMediaType, tmdbId: number) {
  return `${mediaType}-${tmdbId}`;
}

function findItem(
  state: LibraryState,
  mediaType: LibraryMediaType,
  tmdbId: number,
) {
  const fromList =
    mediaType === "movie"
      ? state.movies.find((movie) => movie.tmdb_id === tmdbId)
      : state.series.find((show) => show.tmdb_id === tmdbId);
  if (fromList) {
    return fromList;
  }

  if (mediaType === "movie") {
    for (const page of Object.values(state.movieGroupPages)) {
      const found = page.items.find((movie) => movie.tmdb_id === tmdbId);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  for (const page of Object.values(state.seriesGroupPages)) {
    const found = page.items.find((show) => show.tmdb_id === tmdbId);
    if (found) {
      return found;
    }
  }

  return undefined;
}

function patchItemCopies(
  state: LibraryState,
  mediaType: LibraryMediaType,
  tmdbId: number,
  patch: (item: LibraryMovie | LibrarySeries) => void,
) {
  if (mediaType === "movie") {
    for (const movie of state.movies) {
      if (movie.tmdb_id === tmdbId) {
        patch(movie);
      }
    }
    for (const page of Object.values(state.movieGroupPages)) {
      for (const movie of page.items) {
        if (movie.tmdb_id === tmdbId) {
          patch(movie);
        }
      }
    }
    return;
  }

  for (const show of state.series) {
    if (show.tmdb_id === tmdbId) {
      patch(show);
    }
  }
  for (const page of Object.values(state.seriesGroupPages)) {
    for (const show of page.items) {
      if (show.tmdb_id === tmdbId) {
        patch(show);
      }
    }
  }
}

function updateWatchStatusGroupMeta(
  groups: LibraryGroup[] | undefined,
  fromKey: string,
  toKey: string,
  mediaType: LibraryMediaType,
) {
  if (fromKey === toKey) {
    return groups;
  }

  const nextGroups = groups ? [...groups] : [];
  const fromGroup = nextGroups.find((group) => group.key === fromKey);
  if (fromGroup) {
    fromGroup.count = Math.max(0, fromGroup.count - 1);
  }

  const toGroup = nextGroups.find((group) => group.key === toKey);
  if (toGroup) {
    toGroup.count += 1;
  } else {
    nextGroups.push({
      key: toKey,
      label: libraryGroupLabel(0, toKey, mediaType),
      count: 1,
      hasMore: false,
    });
  }

  return nextGroups
    .filter((group) => group.count > 0)
    .sort((left, right) => Number(left.key) - Number(right.key));
}

function updateImpressionGroupMeta(
  groups: LibraryGroup[] | undefined,
  fromKey: string,
  toKey: string,
) {
  if (fromKey === toKey) {
    return groups;
  }

  const nextGroups = groups ? [...groups] : [];
  const fromGroup = nextGroups.find((group) => group.key === fromKey);
  if (fromGroup) {
    fromGroup.count = Math.max(0, fromGroup.count - 1);
  }

  const toGroup = nextGroups.find((group) => group.key === toKey);
  if (toGroup) {
    toGroup.count += 1;
  } else {
    nextGroups.push({
      key: toKey,
      label: libraryImpressionGroupLabel(toKey),
      count: 1,
      hasMore: false,
    });
  }

  return nextGroups
    .filter((group) => group.count > 0)
    .sort((left, right) => compareImpressionGroupKeys(left.key, right.key));
}

function preserveGroupPageMeta<T extends LibraryMovie | LibrarySeries>(
  next: Record<string, LibraryGroupPage<T>>,
  previous: Record<string, LibraryGroupPage<T>>,
) {
  for (const key of Object.keys(next)) {
    const prev = previous[key];
    if (prev) {
      next[key].hasMore = prev.hasMore;
      next[key].loadingMore = prev.loadingMore;
    }
  }
}

function rebuildGroupPagesFromFlat(
  state: LibraryState,
  mediaType: LibraryMediaType,
) {
  const groupBy = state.query.groupBy;
  if (groupBy === undefined) {
    return;
  }

  if (mediaType === "movie") {
    const previous = state.movieGroupPages;
    state.movieGroupPages = buildGroupPages(
      state.movies,
      state.movieGroups,
      groupBy,
    );
    preserveGroupPageMeta(state.movieGroupPages, previous);
    return;
  }

  const previous = state.seriesGroupPages;
  state.seriesGroupPages = buildGroupPages(
    state.series,
    state.seriesGroups,
    groupBy,
  );
  preserveGroupPageMeta(state.seriesGroupPages, previous);
}

function syncGroupedLibraryAfterPatch(
  state: LibraryState,
  mediaType: LibraryMediaType,
  options?: {
    fromStatus?: number;
    toStatus?: number;
    fromImpression?: number | null;
    toImpression?: number | null;
  },
) {
  if (state.query.groupBy === undefined) {
    return;
  }

  if (
    state.query.groupBy === 0 &&
    options?.fromStatus !== undefined &&
    options.toStatus !== undefined &&
    options.fromStatus !== options.toStatus
  ) {
    const fromKey = String(options.fromStatus);
    const toKey = String(options.toStatus);
    if (mediaType === "movie") {
      state.movieGroups = updateWatchStatusGroupMeta(
        state.movieGroups,
        fromKey,
        toKey,
        "movie",
      );
    } else {
      state.seriesGroups = updateWatchStatusGroupMeta(
        state.seriesGroups,
        fromKey,
        toKey,
        "series",
      );
    }
  }

  if (
    state.query.groupBy === 1 &&
    options?.fromImpression !== undefined &&
    options.toImpression !== undefined
  ) {
    const fromKey = libraryImpressionGroupKey(options.fromImpression);
    const toKey = libraryImpressionGroupKey(options.toImpression);
    if (fromKey !== toKey) {
      if (mediaType === "movie") {
        state.movieGroups = updateImpressionGroupMeta(
          state.movieGroups,
          fromKey,
          toKey,
        );
      } else {
        state.seriesGroups = updateImpressionGroupMeta(
          state.seriesGroups,
          fromKey,
          toKey,
        );
      }
    }
  }

  rebuildGroupPagesFromFlat(state, mediaType);
}

function buildGroupPages<T extends LibraryMovie | LibrarySeries>(
  items: T[],
  groups: LibraryGroup[] | undefined,
  groupBy: LibraryGroupBy | undefined,
): Record<string, LibraryGroupPage<T>> {
  if (groupBy === undefined || !groups?.length) {
    return {};
  }

  const pages: Record<string, LibraryGroupPage<T>> = {};
  for (const group of groups) {
    const groupItems = items.filter(
      (item) => libraryGroupKey(item, groupBy) === group.key,
    );
    pages[group.key] = {
      items: groupItems,
      hasMore: group.hasMore ?? groupItems.length < group.count,
      loadingMore: false,
    };
  }

  return pages;
}

function clearGroupLoading(state: LibraryState) {
  for (const page of Object.values(state.movieGroupPages)) {
    page.loadingMore = false;
  }
  for (const page of Object.values(state.seriesGroupPages)) {
    page.loadingMore = false;
  }
}

function appendUnique<T extends { tmdb_id: number }>(
  existing: T[],
  incoming: T[],
) {
  const seen = new Set(existing.map((item) => item.tmdb_id));
  const next = incoming.filter((item) => !seen.has(item.tmdb_id));
  return next.length === 0 ? existing : [...existing, ...next];
}

function normalizeLibraryGroups(
  groups: LibraryGroup[] | undefined,
  groupBy: LibraryGroupBy | undefined,
  mediaType: LibraryMediaType,
) {
  if (!groups || groupBy === undefined) {
    return groups;
  }

  const normalized = groups.map((group) => ({
    ...group,
    label: libraryGroupLabel(groupBy, group.key, mediaType),
  }));

  if (groupBy === 1) {
    return [...normalized].sort((left, right) =>
      compareImpressionGroupKeys(left.key, right.key),
    );
  }

  return normalized;
}

function applyCounts(
  state: LibraryState,
  metadata: LibraryMetadata,
  type: LibraryMediaType,
) {
  state.movieCount = metadata.count.movies;
  state.seriesCount = metadata.count.series;

  const groups = normalizeLibraryGroups(
    metadata.groups,
    state.query.groupBy,
    type,
  );
  if (type === "movie") {
    state.movieGroups = groups;
  } else {
    state.seriesGroups = groups;
  }
}

function applySeriesProgress(
  item: LibrarySeries,
  update: SeriesProgressFields,
) {
  if (update.watch_status !== null) {
    item.watch_status = update.watch_status;
  }
  item.impression = update.impression;
  item.total_number_of_episodes_watched =
    update.total_number_of_episodes_watched;
  item.total_number_of_seasons_watched = update.total_number_of_seasons_watched;

  const airDateBySeason = new Map(
    item.seasons_info.map((season) => [season.season_number, season.air_date]),
  );

  item.seasons_info = update.seasons.map(
    (season): LibrarySeriesSeason => ({
      season_number: season.season_number,
      episode_count: season.episode_count,
      episodes_watched: season.episodes_watched,
      air_date: airDateBySeason.get(season.season_number) ?? null,
    }),
  );
}

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    libraryRequested: (
      state,
      action: PayloadAction<{ type: LibraryMediaType; refresh?: boolean }>,
    ) => {
      const loaded =
        action.payload.type === "movie"
          ? state.moviesLoaded
          : state.seriesLoaded;
      if (loaded && !action.payload.refresh) return;

      if (state.status !== "succeeded") {
        state.status = "loading";
      }
      state.error = null;
    },
    librarySucceeded: (
      state,
      action: PayloadAction<{
        type: LibraryMediaType;
        movies: LibraryMovie[];
        series: LibrarySeries[];
        metadata: LibraryMetadata;
      }>,
    ) => {
      const { type, movies, series, metadata } = action.payload;
      applyCounts(state, metadata, type);

      const isGrouped = state.query.groupBy !== undefined;

      if (type === "movie") {
        state.movies = movies;
        state.moviesHasMore = !isGrouped && metadata.hasMore;
        state.moviesLoaded = true;
        state.moviesLoadingMore = false;
        state.movieGroupPages = buildGroupPages(
          movies,
          metadata.groups,
          state.query.groupBy,
        );
      } else {
        state.series = series;
        state.seriesHasMore = !isGrouped && metadata.hasMore;
        state.seriesLoaded = true;
        state.seriesLoadingMore = false;
        state.seriesGroupPages = buildGroupPages(
          series,
          metadata.groups,
          state.query.groupBy,
        );
      }

      state.status = "succeeded";
      state.error = null;
    },
    libraryCollectionSelected: (
      state,
      action: PayloadAction<number | null>,
    ) => {
      state.selectedCollectionId = action.payload;
    },
    libraryQueryUpdated: (
      state,
      action: PayloadAction<LibraryBrowseQuery>,
    ) => {
      state.query = action.payload;
      state.queryNonce += 1;
      state.movies = [];
      state.series = [];
      state.movieGroups = undefined;
      state.seriesGroups = undefined;
      state.movieGroupPages = {};
      state.seriesGroupPages = {};
      state.moviesLoaded = false;
      state.seriesLoaded = false;
      state.moviesHasMore = false;
      state.seriesHasMore = false;
      state.moviesLoadingMore = false;
      state.seriesLoadingMore = false;
      state.error = null;
    },
    libraryFailed: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
      state.moviesLoadingMore = false;
      state.seriesLoadingMore = false;
      clearGroupLoading(state);
    },
    libraryPageRequested: (
      state,
      action: PayloadAction<{ type: LibraryMediaType }>,
    ) => {
      if (action.payload.type === "movie") {
        if (!state.moviesHasMore || state.moviesLoadingMore) return;
        state.moviesLoadingMore = true;
      } else {
        if (!state.seriesHasMore || state.seriesLoadingMore) return;
        state.seriesLoadingMore = true;
      }
      state.error = null;
    },
    libraryPageSucceeded: (
      state,
      action: PayloadAction<{
        type: LibraryMediaType;
        movies: LibraryMovie[];
        series: LibrarySeries[];
        metadata: LibraryMetadata;
      }>,
    ) => {
      const { type, movies, series, metadata } = action.payload;
      applyCounts(state, metadata, type);

      if (type === "movie") {
        state.movies = appendUnique(state.movies, movies);
        state.moviesHasMore = metadata.hasMore;
        state.moviesLoadingMore = false;
      } else {
        state.series = appendUnique(state.series, series);
        state.seriesHasMore = metadata.hasMore;
        state.seriesLoadingMore = false;
      }
    },
    libraryPageFailed: (
      state,
      action: PayloadAction<{ type: LibraryMediaType; error: string }>,
    ) => {
      if (action.payload.type === "movie") {
        state.moviesLoadingMore = false;
      } else {
        state.seriesLoadingMore = false;
      }
      state.error = action.payload.error;
    },
    libraryGroupPageRequested: (
      state,
      action: PayloadAction<{ type: LibraryMediaType; groupKey: string }>,
    ) => {
      const pages =
        action.payload.type === "movie"
          ? state.movieGroupPages
          : state.seriesGroupPages;
      const page = pages[action.payload.groupKey];
      if (!page || !page.hasMore || page.loadingMore) return;
      page.loadingMore = true;
      state.error = null;
    },
    libraryGroupPageSucceeded: (
      state,
      action: PayloadAction<{
        type: LibraryMediaType;
        groupKey: string;
        movies: LibraryMovie[];
        series: LibrarySeries[];
        metadata: LibraryMetadata;
      }>,
    ) => {
      const { type, groupKey, movies, series, metadata } = action.payload;
      const pageHasMore =
        metadata.groups?.[0]?.hasMore ?? metadata.hasMore;

      if (type === "movie") {
        const page = state.movieGroupPages[groupKey];
        if (page) {
          page.items = appendUnique(page.items, movies);
          page.hasMore = pageHasMore;
          page.loadingMore = false;
        }
        state.movies = appendUnique(state.movies, movies);
      } else {
        const page = state.seriesGroupPages[groupKey];
        if (page) {
          page.items = appendUnique(page.items, series);
          page.hasMore = pageHasMore;
          page.loadingMore = false;
        }
        state.series = appendUnique(state.series, series);
      }
    },
    libraryGroupPageFailed: (
      state,
      action: PayloadAction<{
        type: LibraryMediaType;
        groupKey: string;
        error: string;
      }>,
    ) => {
      const pages =
        action.payload.type === "movie"
          ? state.movieGroupPages
          : state.seriesGroupPages;
      const page = pages[action.payload.groupKey];
      if (page) {
        page.loadingMore = false;
      }
      state.error = action.payload.error;
    },
    libraryItemMutationRequested: (
      state,
      action: PayloadAction<LibraryItemMutation>,
    ) => {
      const { mediaType, tmdbId, watch_status, impression, progress } = action.payload;
      const item = findItem(state, mediaType, tmdbId);
      if (!item) return;

      const key = libraryItemKey(mediaType, tmdbId);
      const previousStatus = item.watch_status;
      const previousImpression = item.impression;
      const pendingType =
        watch_status !== undefined
          ? "watch_status"
          : impression !== undefined
            ? "impression"
            : progress !== undefined
              ? "progress"
              : undefined;

      state.pending[key] = {
        watch_status: state.pending[key]?.watch_status ?? item.watch_status,
        impression: state.pending[key]?.impression ?? item.impression,
        pendingType,
      };

      if (watch_status !== undefined) {
        patchItemCopies(state, mediaType, tmdbId, (copy) => {
          copy.watch_status = watch_status;
        });
        syncGroupedLibraryAfterPatch(state, mediaType, {
          fromStatus: previousStatus,
          toStatus: watch_status,
        });
      }
      if (impression !== undefined) {
        patchItemCopies(state, mediaType, tmdbId, (copy) => {
          copy.impression = impression;
        });
        syncGroupedLibraryAfterPatch(state, mediaType, {
          fromImpression: previousImpression,
          toImpression: impression,
        });
      }
    },
    libraryItemMutationSucceeded: (
      state,
      action: PayloadAction<{
        tmdbId: number;
        mediaType: LibraryMediaType;
        seriesUpdate?: SeriesProgressFields;
      }>,
    ) => {
      const { mediaType, tmdbId, seriesUpdate } = action.payload;
      const key = libraryItemKey(mediaType, tmdbId);
      const snapshot = state.pending[key];
      delete state.pending[key];

      if (mediaType === "series" && seriesUpdate) {
        const previousStatus = snapshot?.watch_status;
        const previousImpression = snapshot?.impression;
        patchItemCopies(state, "series", tmdbId, (copy) => {
          if ("seasons_info" in copy) {
            applySeriesProgress(copy, seriesUpdate);
          }
        });
        syncGroupedLibraryAfterPatch(state, "series", {
          fromStatus: previousStatus,
          toStatus: seriesUpdate.watch_status ?? undefined,
          fromImpression: previousImpression,
          toImpression: seriesUpdate.impression,
        });
      }
    },
    libraryWatchlistItemAdded: (
      state,
      action: PayloadAction<{ mediaType: LibraryMediaType }>,
    ) => {
      if (action.payload.mediaType === "movie") {
        state.movieCount += 1;
      } else {
        state.seriesCount += 1;
      }
    },
    libraryItemMutationFailed: (
      state,
      action: PayloadAction<{
        tmdbId: number;
        mediaType: LibraryMediaType;
        error: string;
      }>,
    ) => {
      const { mediaType, tmdbId, error } = action.payload;
      const key = libraryItemKey(mediaType, tmdbId);
      const snapshot = state.pending[key];
      const item = findItem(state, mediaType, tmdbId);

      if (item && snapshot) {
        const currentStatus = item.watch_status;
        const currentImpression = item.impression;
        patchItemCopies(state, mediaType, tmdbId, (copy) => {
          copy.watch_status = snapshot.watch_status;
          copy.impression = snapshot.impression;
        });
        syncGroupedLibraryAfterPatch(state, mediaType, {
          fromStatus: currentStatus,
          toStatus: snapshot.watch_status,
          fromImpression: currentImpression,
          toImpression: snapshot.impression,
        });
      }

      delete state.pending[key];
      state.error = error;
    },
  },
});

export const {
  libraryFailed,
  libraryGroupPageFailed,
  libraryGroupPageRequested,
  libraryGroupPageSucceeded,
  libraryItemMutationFailed,
  libraryItemMutationRequested,
  libraryItemMutationSucceeded,
  libraryPageFailed,
  libraryPageRequested,
  libraryPageSucceeded,
  libraryCollectionSelected,
  libraryQueryUpdated,
  libraryRequested,
  librarySucceeded,
  libraryWatchlistItemAdded,
} = librarySlice.actions;
export default librarySlice.reducer;
