import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DEFAULT_LIBRARY_BROWSE_QUERY } from "@/lib/constants";
import { libraryGroupKey } from "@/lib/media/library-browse";
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

function buildGroupPages<T extends LibraryMovie | LibrarySeries>(
  items: T[],
  groups: LibraryGroup[] | undefined,
  groupBy: LibraryGroupBy | undefined,
  mediaType: LibraryMediaType,
): Record<string, LibraryGroupPage<T>> {
  if (groupBy === undefined || !groups?.length) {
    return {};
  }

  const pages: Record<string, LibraryGroupPage<T>> = {};
  for (const group of groups) {
    const groupItems = items.filter(
      (item) => libraryGroupKey(item, groupBy, mediaType) === group.key,
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

function applyCounts(
  state: LibraryState,
  metadata: LibraryMetadata,
  type: LibraryMediaType,
) {
  state.movieCount = metadata.count.movies;
  state.seriesCount = metadata.count.series;
  if (type === "movie") {
    state.movieGroups = metadata.groups;
  } else {
    state.seriesGroups = metadata.groups;
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
      action: PayloadAction<{ type: LibraryMediaType }>,
    ) => {
      const loaded =
        action.payload.type === "movie"
          ? state.moviesLoaded
          : state.seriesLoaded;
      if (loaded) return;

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
          "movie",
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
          "series",
        );
      }

      state.status = "succeeded";
      state.error = null;
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
        item.watch_status = watch_status;
      }
      if (impression !== undefined) {
        item.impression = impression;
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
      delete state.pending[libraryItemKey(mediaType, tmdbId)];

      if (mediaType === "series" && seriesUpdate) {
        const item = findItem(state, "series", tmdbId);
        if (item && "seasons_info" in item) {
          applySeriesProgress(item, seriesUpdate);
        }
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
        item.watch_status = snapshot.watch_status;
        item.impression = snapshot.impression;
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
  libraryQueryUpdated,
  libraryRequested,
  librarySucceeded,
} = librarySlice.actions;
export default librarySlice.reducer;
