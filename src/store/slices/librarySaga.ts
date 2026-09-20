import type { SagaIterator } from "redux-saga";
import { call, put, select, takeEvery, takeLatest } from "redux-saga/effects";

import { LIBRARY_PAGE_SIZE } from "@/lib/constants";
import { apiFetch } from "@/lib/http/client";
import { toLibrarySearchParams } from "@/lib/media/library-browse";
import type {
  LibraryMetadata,
  LibraryMovie,
  LibrarySeries,
} from "@/lib/types";
import { showToast } from "./toastSlice";
import {
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
  libraryRequested,
  librarySucceeded,
  type LibraryState,
  type SeriesProgressFields,
} from "./librarySlice";

type LibraryResponse = {
  error?: string;
  movies?: LibraryMovie[];
  series?: LibrarySeries[];
  metadata?: LibraryMetadata;
};

type SeriesPatchResponse = SeriesProgressFields & {
  error?: string;
};

type LibraryRoot = { library: LibraryState };

const emptyMetadata = (offset: number): LibraryMetadata => ({
  count: { movies: 0, series: 0 },
  offset,
  limit: LIBRARY_PAGE_SIZE,
  hasMore: false,
});

const activePageFetches = new Set<string>();
const activeLibraryMutations = new Set<string>();

function isLibraryFetchRoute() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/library");
}

function* fetchLibrary(
  action: ReturnType<typeof libraryRequested>,
): SagaIterator {
  if (!isLibraryFetchRoute()) return;

  const mediaType = action.payload.type;
  const library: LibraryState = yield select(
    (state: LibraryRoot) => state.library,
  );
  const alreadyLoaded =
    mediaType === "movie" ? library.moviesLoaded : library.seriesLoaded;
  if (alreadyLoaded && !action.payload.refresh) return;

  const requestNonce = library.queryNonce;
  const params = toLibrarySearchParams(
    mediaType,
    0,
    LIBRARY_PAGE_SIZE,
    library.query,
  );

  try {
    const response: Response = yield call(
      fetch,
      `/api/library?${params.toString()}`,
      { cache: "no-store" },
    );
    const data: LibraryResponse = yield call([response, "json"]);

    if (!response.ok) {
      throw new Error(data.error ?? "Library request failed");
    }

    const current: LibraryState = yield select(
      (state: LibraryRoot) => state.library,
    );
    if (current.queryNonce !== requestNonce) return;

    yield put(
      librarySucceeded({
        type: mediaType,
        movies: data.movies ?? [],
        series: data.series ?? [],
        metadata: data.metadata ?? emptyMetadata(0),
      }),
    );
  } catch (error) {
    const current: LibraryState = yield select(
      (state: LibraryRoot) => state.library,
    );
    if (current.queryNonce !== requestNonce) return;

    const message =
      error instanceof Error ? error.message : "Library request failed";
    yield put(showToast({ message, variant: "error" }));
    yield put(libraryFailed(message));
  }
}

function* fetchLibraryPage(
  action: ReturnType<typeof libraryPageRequested>,
): SagaIterator {
  const mediaType = action.payload.type;
  if (activePageFetches.has(mediaType)) return;
  activePageFetches.add(mediaType);

  const library: LibraryState = yield select(
    (state: LibraryRoot) => state.library,
  );
  const hasMore =
    mediaType === "movie" ? library.moviesHasMore : library.seriesHasMore;

  if (!hasMore || library.status !== "succeeded") {
    activePageFetches.delete(mediaType);
    return;
  }

  const requestNonce = library.queryNonce;
  const offset =
    mediaType === "movie" ? library.movies.length : library.series.length;
  const params = toLibrarySearchParams(
    mediaType,
    offset,
    LIBRARY_PAGE_SIZE,
    library.query,
  );

  try {
    const response: Response = yield call(
      fetch,
      `/api/library?${params.toString()}`,
      { cache: "no-store" },
    );
    const data: LibraryResponse = yield call([response, "json"]);

    if (!response.ok) {
      throw new Error(data.error ?? "Library request failed");
    }

    const current: LibraryState = yield select(
      (state: LibraryRoot) => state.library,
    );
    if (current.queryNonce !== requestNonce) return;

    yield put(
      libraryPageSucceeded({
        type: mediaType,
        movies: data.movies ?? [],
        series: data.series ?? [],
        metadata: data.metadata ?? emptyMetadata(offset),
      }),
    );
  } catch (error) {
    const current: LibraryState = yield select(
      (state: LibraryRoot) => state.library,
    );
    if (current.queryNonce !== requestNonce) return;

    const message =
      error instanceof Error ? error.message : "Library request failed";
    yield put(showToast({ message, variant: "error" }));
    yield put(
      libraryPageFailed({
        type: mediaType,
        error: message,
      }),
    );
  } finally {
    activePageFetches.delete(mediaType);
  }
}

function* fetchLibraryGroupPage(
  action: ReturnType<typeof libraryGroupPageRequested>,
): SagaIterator {
  const { type: mediaType, groupKey } = action.payload;
  const fetchKey = `${mediaType}:${groupKey}`;
  if (activePageFetches.has(fetchKey)) return;
  activePageFetches.add(fetchKey);

  const library: LibraryState = yield select(
    (state: LibraryRoot) => state.library,
  );
  const pages =
    mediaType === "movie" ? library.movieGroupPages : library.seriesGroupPages;
  const page = pages[groupKey];

  if (!page?.hasMore || library.status !== "succeeded") {
    activePageFetches.delete(fetchKey);
    return;
  }

  const requestNonce = library.queryNonce;
  const params = toLibrarySearchParams(
    mediaType,
    page.items.length,
    LIBRARY_PAGE_SIZE,
    library.query,
    groupKey,
  );

  try {
    const response: Response = yield call(
      fetch,
      `/api/library?${params.toString()}`,
      { cache: "no-store" },
    );
    const data: LibraryResponse = yield call([response, "json"]);

    if (!response.ok) {
      throw new Error(data.error ?? "Library request failed");
    }

    const current: LibraryState = yield select(
      (state: LibraryRoot) => state.library,
    );
    if (current.queryNonce !== requestNonce) return;

    yield put(
      libraryGroupPageSucceeded({
        type: mediaType,
        groupKey,
        movies: data.movies ?? [],
        series: data.series ?? [],
        metadata: data.metadata ?? emptyMetadata(page.items.length),
      }),
    );
  } catch (error) {
    const current: LibraryState = yield select(
      (state: LibraryRoot) => state.library,
    );
    if (current.queryNonce !== requestNonce) return;

    const message =
      error instanceof Error ? error.message : "Library request failed";
    yield put(showToast({ message, variant: "error" }));
    yield put(
      libraryGroupPageFailed({
        type: mediaType,
        groupKey,
        error: message,
      }),
    );
  } finally {
    activePageFetches.delete(fetchKey);
  }
}

function* mutateLibraryItem(
  action: ReturnType<typeof libraryItemMutationRequested>,
): SagaIterator {
  const { mediaType, tmdbId, watch_status, impression, progress } =
    action.payload;
  const mutationKey = `${mediaType}:${tmdbId}`;

  if (activeLibraryMutations.has(mutationKey)) return;
  activeLibraryMutations.add(mutationKey);

  const body = progress
    ? {
        mark_season_to_watched: progress.seasonNumber,
        mark_episode_to_watched: progress.episodeNumber,
      }
    : watch_status !== undefined
      ? { watch_status }
      : { impression };

  try {
    const response: Response = yield call(
      apiFetch,
      `/api/${mediaType}/${tmdbId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data: SeriesPatchResponse = yield call([response, "json"]);

    if (!response.ok) {
      throw new Error(data.error ?? "Library update failed");
    }

    const seriesUpdate =
      mediaType === "series" && progress && data.seasons
        ? {
            watch_status: data.watch_status ?? null,
            impression: data.impression ?? null,
            total_number_of_episodes_watched:
              data.total_number_of_episodes_watched ?? 0,
            total_number_of_seasons_watched:
              data.total_number_of_seasons_watched ?? 0,
            seasons: data.seasons,
          }
        : undefined;

    yield put(
      libraryItemMutationSucceeded({ mediaType, tmdbId, seriesUpdate }),
    );
  } catch (error) {
    yield put(
      libraryItemMutationFailed({
        mediaType,
        tmdbId,
        error: error instanceof Error ? error.message : "Library update failed",
      }),
    );
  } finally {
    activeLibraryMutations.delete(mutationKey);
  }
}

export function* librarySaga(): SagaIterator {
  yield takeLatest(libraryRequested.type, fetchLibrary);
  yield takeEvery(libraryPageRequested.type, fetchLibraryPage);
  yield takeEvery(libraryGroupPageRequested.type, fetchLibraryGroupPage);
  yield takeEvery(libraryItemMutationRequested.type, mutateLibraryItem);
}
