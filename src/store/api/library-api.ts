import { apiFetch } from "@/lib/http/client";
import {
  appendLibraryGroupPage,
  appendLibraryPage,
  fetchCollectionPayload,
  fetchLibraryPayload,
  libraryViewFromPayload,
  patchCarouselPage,
  patchDashboard,
  patchLibraryView,
  setGroupLoading,
  type LibraryApiPayload,
  type LibraryChange,
  type LibraryViewData,
  type SeriesProgressFields,
} from "@/lib/media/library-patch";
import type {
  LibraryBrowseQuery,
  LibraryGroupBy,
  LibraryMediaType,
} from "@/lib/types";
import type { DashboardData } from "@/services/dashboard";
import {
  completionImpressionPrompt,
  impressionPromptFailed,
  impressionPromptRequested,
  impressionPromptResolved,
} from "@/store/slices/impressionPromptSlice";
import { showToast } from "@/store/slices/toastSlice";
import {
  baseApi,
  libraryTagIds,
  settledErrorMessage,
} from "@/store/api/base-api";

export type LibraryMutationInput = {
  mediaType: LibraryMediaType;
  tmdbId: number;
  title?: string;
  watch_status?: number;
  impression?: number | null;
  remove?: boolean;
  add?: boolean;
  progress?: {
    seasonNumber: number;
    episodeNumber: number;
  };
};

type MutationResponse = SeriesProgressFields & { error?: string };

// RTK's updateQueryData thunk is generic over the whole api state, which this
// module cannot name without a circular import of the store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppDispatch = (action: any) => any;
type RootState = Parameters<typeof libraryApi.util.selectCachedArgsForQuery>[0];

const inflightMutations = new Map<string, Promise<void>>();

export const libraryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLibraryView: build.query<
      LibraryViewData,
      { mediaType: LibraryMediaType; query: LibraryBrowseQuery }
    >({
      queryFn: async ({ mediaType, query }) => {
        try {
          const payload = await fetchLibraryPayload(mediaType, query, 0);
          return {
            data: libraryViewFromPayload(
              mediaType,
              query.groupBy,
              payload,
              null,
            ),
          };
        } catch (error) {
          return {
            error: {
              status: 500,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to load library",
            },
          };
        }
      },
      providesTags: ["Library"],
    }),
    getCollectionView: build.query<
      LibraryViewData,
      { collectionId: number; search: string }
    >({
      queryFn: async ({ collectionId, search }) => {
        try {
          const payload = await fetchCollectionPayload(collectionId, search, 0);
          const mediaType: LibraryMediaType =
            payload.collection?.mediaType === 0 ? "movie" : "series";
          const groupBy =
            payload.collection?.groupBy === null ||
            payload.collection?.groupBy === undefined
              ? null
              : (payload.collection.groupBy as LibraryGroupBy);
          return { data: libraryViewFromPayload(mediaType, groupBy, payload) };
        } catch (error) {
          return {
            error: {
              status: 500,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to load collection items",
            },
          };
        }
      },
      providesTags: ["Collection"],
    }),
    getCollectionCarouselPages: build.infiniteQuery<
      {
        movies: LibraryApiPayload["movies"];
        series: LibraryApiPayload["series"];
        metadata: LibraryApiPayload["metadata"];
      },
      number,
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          if (!lastPage.metadata.hasMore) return undefined;
          const count = lastPage.movies.length + lastPage.series.length;
          return lastPageParam + count;
        },
      },
      queryFn: async ({ queryArg: collectionId, pageParam }) => {
        try {
          const payload = await fetchCollectionPayload(
            collectionId,
            "",
            pageParam,
          );
          return {
            data: {
              movies: payload.movies,
              series: payload.series,
              metadata: payload.metadata,
            },
          };
        } catch (error) {
          return {
            error: {
              status: 500,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to load collection items",
            },
          };
        }
      },
      providesTags: ["CollectionCarousel"],
    }),
    getDashboard: build.query<DashboardData, void>({
      query: () => ({ url: "/api/dashboard" }),
      providesTags: ["Dashboard"],
    }),
    mutateLibraryItem: build.mutation<MutationResponse, LibraryMutationInput>({
      queryFn: async (input) => {
        try {
          if (input.remove) {
            const response = await apiFetch(
              `/api/${input.mediaType}/${input.tmdbId}`,
              { method: "DELETE" },
            );
            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
              return {
                error: {
                  status: response.status,
                  message: data.error ?? "Failed to remove from watchlist",
                },
              };
            }
            return { data: {} as MutationResponse };
          }

          if (input.add) {
            const response = await apiFetch(
              `/api/${input.mediaType}/${input.tmdbId}`,
              { method: "POST" },
            );
            const data = (await response.json()) as MutationResponse;
            if (!response.ok) {
              return {
                error: {
                  status: response.status,
                  message:
                    (data as { error?: string }).error ??
                    "Failed to add to library",
                },
              };
            }
            return { data };
          }

          const body = input.progress
            ? {
                mark_season_to_watched: input.progress.seasonNumber,
                mark_episode_to_watched: input.progress.episodeNumber,
              }
            : input.watch_status !== undefined
              ? { watch_status: input.watch_status }
              : { impression: input.impression };

          const response = await apiFetch(
            `/api/${input.mediaType}/${input.tmdbId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
          );
          const data = (await response.json()) as MutationResponse;
          if (!response.ok) {
            return {
              error: {
                status: response.status,
                message: data.error ?? "Library update failed",
              },
            };
          }
          return { data };
        } catch (error) {
          return {
            error: {
              status: 0,
              message:
                error instanceof Error
                  ? error.message
                  : "Library update failed",
            },
          };
        }
      },
      async onQueryStarted(input, { dispatch, getState, queryFulfilled }) {
        const undos = patchLibraryCaches(dispatch, getState, input);
        const { patchCachedContentDetails } =
          await import("./content-details-api");
        const detailsUndo = patchCachedContentDetails(dispatch, getState, {
          mediaType: input.mediaType,
          id: String(input.tmdbId),
          watch_status: input.watch_status,
          impression: input.impression,
          remove: input.remove,
        });
        if (detailsUndo) undos.push(detailsUndo);

        try {
          const { data } = await queryFulfilled;
          const seriesUpdate =
            input.mediaType === "series" && input.progress && data.seasons
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

          if (seriesUpdate) {
            patchLibraryCaches(dispatch, getState, {
              mediaType: input.mediaType,
              tmdbId: input.tmdbId,
              seriesUpdate,
            });
            patchCachedContentDetails(dispatch, getState, {
              mediaType: input.mediaType,
              id: String(input.tmdbId),
              watch_status: seriesUpdate.watch_status,
              impression: seriesUpdate.impression,
              episodesWatched: seriesUpdate.total_number_of_episodes_watched,
              seasonsWatched: seriesUpdate.total_number_of_seasons_watched,
              seasons: seriesUpdate.seasons,
            });
          }

          if (input.remove) {
            dispatch(
              showToast({
                message: "Removed from your library",
                variant: "success",
              }),
            );
          }

          if (input.add) {
            dispatch(
              showToast({
                message: "Added to your library",
                variant: "success",
              }),
            );
          }

          if (input.watch_status !== undefined || input.progress) {
            const prompt = completionImpressionPrompt({
              mediaType: input.mediaType,
              tmdbId: input.tmdbId,
              title: input.title ?? "this title",
              source: "library",
              impression: data.impression,
              requestedWatchStatus: input.watch_status,
              requestedProgress: input.progress,
              seasons: data.seasons,
              resultingWatchStatus: data.watch_status,
            });
            if (prompt) dispatch(impressionPromptRequested(prompt));
          }

          if (input.impression !== undefined) {
            dispatch(
              impressionPromptResolved({
                mediaType: input.mediaType,
                tmdbId: input.tmdbId,
              }),
            );
          }

          dispatch(
            libraryApi.util.invalidateTags([
              ...libraryTagIds,
              "Franchise",
              "Franchises",
            ]),
          );
        } catch (caught) {
          for (const undo of undos) undo();
          const message = settledErrorMessage(caught, "Library update failed");
          dispatch(showToast({ message, variant: "error" }));
          if (input.impression !== undefined) {
            dispatch(
              impressionPromptFailed({
                mediaType: input.mediaType,
                tmdbId: input.tmdbId,
                error: message,
              }),
            );
          }
        }
      },
    }),
  }),
});

export function patchLibraryCaches(
  dispatch: AppDispatch,
  getState: () => unknown,
  change: LibraryChange,
) {
  const state = getState() as RootState;
  const undos: Array<() => void> = [];

  for (const arg of libraryApi.util.selectCachedArgsForQuery(
    state,
    "getLibraryView",
  )) {
    const patch = dispatch(
      libraryApi.util.updateQueryData("getLibraryView", arg, (draft) =>
        patchLibraryView(draft, change),
      ),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  for (const arg of libraryApi.util.selectCachedArgsForQuery(
    state,
    "getCollectionView",
  )) {
    const patch = dispatch(
      libraryApi.util.updateQueryData("getCollectionView", arg, (draft) =>
        patchLibraryView(draft, change),
      ),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  for (const arg of libraryApi.util.selectCachedArgsForQuery(
    state,
    "getCollectionCarouselPages",
  )) {
    const patch = dispatch(
      libraryApi.util.updateQueryData(
        "getCollectionCarouselPages",
        arg,
        (draft) => {
          for (let index = 0; index < draft.pages.length; index += 1) {
            const patched = patchCarouselPage(draft.pages[index], change);
            if (patched.found) draft.pages[index] = patched.page;
          }
        },
      ),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  for (const arg of libraryApi.util.selectCachedArgsForQuery(
    state,
    "getDashboard",
  )) {
    const patch = dispatch(
      libraryApi.util.updateQueryData("getDashboard", arg, (draft) =>
        patchDashboard(draft, change),
      ),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  return undos;
}

export function submitLibraryMutation(
  dispatch: AppDispatch,
  input: LibraryMutationInput,
) {
  const key = `${input.mediaType}:${input.tmdbId}`;
  const existing = inflightMutations.get(key);
  if (existing) return existing;

  const request = dispatch(
    libraryApi.endpoints.mutateLibraryItem.initiate(input, {
      fixedCacheKey: `library-item-${input.mediaType}-${input.tmdbId}`,
    }),
  );
  const promise = request
    .then(() => undefined)
    .finally(() => {
      inflightMutations.delete(key);
    });
  inflightMutations.set(key, promise);
  return promise;
}

export async function loadMoreLibrary(
  dispatch: AppDispatch,
  mediaType: LibraryMediaType,
  query: LibraryBrowseQuery,
  offset: number,
) {
  const payload = await fetchLibraryPayload(mediaType, query, offset);
  dispatch(
    libraryApi.util.updateQueryData(
      "getLibraryView",
      { mediaType, query },
      (draft) => appendLibraryPage(draft, payload),
    ),
  );
}

export async function loadMoreLibraryGroup(
  dispatch: AppDispatch,
  mediaType: LibraryMediaType,
  query: LibraryBrowseQuery,
  groupKey: string,
  offset: number,
) {
  dispatch(
    libraryApi.util.updateQueryData(
      "getLibraryView",
      { mediaType, query },
      (draft) => setGroupLoading(draft, groupKey, true),
    ),
  );
  try {
    const payload = await fetchLibraryPayload(
      mediaType,
      query,
      offset,
      groupKey,
    );
    dispatch(
      libraryApi.util.updateQueryData(
        "getLibraryView",
        { mediaType, query },
        (draft) => appendLibraryGroupPage(draft, groupKey, payload),
      ),
    );
  } catch (error) {
    dispatch(
      libraryApi.util.updateQueryData(
        "getLibraryView",
        { mediaType, query },
        (draft) => setGroupLoading(draft, groupKey, false),
      ),
    );
    throw error;
  }
}

export async function loadMoreCollection(
  dispatch: AppDispatch,
  collectionId: number,
  search: string,
  offset: number,
) {
  const payload = await fetchCollectionPayload(collectionId, search, offset);
  dispatch(
    libraryApi.util.updateQueryData(
      "getCollectionView",
      { collectionId, search },
      (draft) => appendLibraryPage(draft, payload),
    ),
  );
}

export async function loadMoreCollectionGroup(
  dispatch: AppDispatch,
  collectionId: number,
  search: string,
  groupKey: string,
  offset: number,
) {
  dispatch(
    libraryApi.util.updateQueryData(
      "getCollectionView",
      { collectionId, search },
      (draft) => setGroupLoading(draft, groupKey, true),
    ),
  );
  try {
    const payload = await fetchCollectionPayload(
      collectionId,
      search,
      offset,
      groupKey,
    );
    dispatch(
      libraryApi.util.updateQueryData(
        "getCollectionView",
        { collectionId, search },
        (draft) => appendLibraryGroupPage(draft, groupKey, payload),
      ),
    );
  } catch (error) {
    dispatch(
      libraryApi.util.updateQueryData(
        "getCollectionView",
        { collectionId, search },
        (draft) => setGroupLoading(draft, groupKey, false),
      ),
    );
    throw error;
  }
}

export const {
  useGetLibraryViewQuery,
  useGetCollectionViewQuery,
  useGetCollectionCarouselPagesInfiniteQuery,
  useGetDashboardQuery,
  useMutateLibraryItemMutation,
} = libraryApi;
