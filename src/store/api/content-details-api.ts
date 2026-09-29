import { apiFetch } from "@/lib/http/client";
import { IMPRESSION, WATCH_STATUS } from "@/lib/constants";
import type { SeriesProgressFields } from "@/lib/media/library-patch";
import { libraryTagIds, settledErrorMessage } from "@/store/api/base-api";
import {
  type ContentDetailsData,
  type ContentLibraryFields,
  type ContentMediaType,
  type ContentMutationArg,
} from "@/store/api/content-types";
import { libraryApi, patchLibraryCaches } from "@/store/api/library-api";
import { baseApi } from "@/store/api/base-api";
import {
  completionImpressionPrompt,
  impressionPromptFailed,
  impressionPromptRequested,
  impressionPromptResolved,
} from "@/store/slices/impressionPromptSlice";
import { showToast } from "@/store/slices/toastSlice";

type MutationResponse = ContentLibraryFields &
  ContentDetailsData & { error?: string };
// See library-api.ts. The thunk state cannot be named from this module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppDispatch = (action: any) => any;
type RootState = Parameters<
  typeof contentDetailsApi.util.selectCachedArgsForQuery
>[0];

const inflightMutations = new Map<string, Promise<void>>();

export type DetailsCachePatch = {
  mediaType: ContentMediaType;
  id: string;
  replace?: ContentDetailsData;
  watch_status?: number | null;
  impression?: number | null;
  remove?: boolean;
  episodesWatched?: number;
  seasonsWatched?: number;
  seasons?: Array<{ season_number: number; episodes_watched: number }>;
  fields?: ContentLibraryFields;
};

function applyDetailsPatch(
  current: ContentDetailsData,
  change: DetailsCachePatch,
) {
  if (change.replace) return change.replace;
  const next = { ...current };

  if (change.remove) {
    next.is_present_in_watchlist = false;
    next.watch_status = null;
    next.impression = null;
    if ("total_number_of_episodes_watched" in next) {
      next.total_number_of_episodes_watched = 0;
      next.total_number_of_seasons_watched = 0;
    }
    if ("seasons" in next && Array.isArray(next.seasons)) {
      next.seasons = next.seasons.map((season) => ({
        ...season,
        episodes_watched: 0,
      }));
    }
    return next;
  }

  if (change.fields) {
    const { seasons, ...libraryFields } = change.fields;
    Object.assign(next, libraryFields);
    if (seasons && "seasons" in next && Array.isArray(next.seasons)) {
      const progressByNumber = new Map(
        seasons.map((season) => [
          season.season_number,
          season.episodes_watched,
        ]),
      );
      next.seasons = next.seasons.map((season) => ({
        ...season,
        episodes_watched:
          season.season_number === undefined
            ? season.episodes_watched
            : (progressByNumber.get(season.season_number) ??
              season.episodes_watched),
      }));
    }
    return next;
  }

  if (change.watch_status !== undefined)
    next.watch_status = change.watch_status;
  if (change.impression !== undefined) next.impression = change.impression;
  if (
    change.episodesWatched !== undefined &&
    "total_number_of_episodes_watched" in next
  ) {
    next.total_number_of_episodes_watched = change.episodesWatched;
  }
  if (
    change.seasonsWatched !== undefined &&
    "total_number_of_seasons_watched" in next
  ) {
    next.total_number_of_seasons_watched = change.seasonsWatched;
  }
  if (change.seasons && "seasons" in next && Array.isArray(next.seasons)) {
    const progressByNumber = new Map(
      change.seasons.map((season) => [
        season.season_number,
        season.episodes_watched,
      ]),
    );
    next.seasons = next.seasons.map((season) => ({
      ...season,
      episodes_watched:
        season.season_number === undefined
          ? season.episodes_watched
          : (progressByNumber.get(season.season_number) ??
            season.episodes_watched),
    }));
  }
  return next;
}

export function patchCachedContentDetails(
  dispatch: AppDispatch,
  getState: () => unknown,
  change: DetailsCachePatch,
) {
  const state = getState() as RootState;
  const arg = contentDetailsApi.util
    .selectCachedArgsForQuery(state, "getContentDetails")
    .find(
      (item) => item.mediaType === change.mediaType && item.id === change.id,
    );
  if (!arg) return undefined;
  const patch = dispatch(
    contentDetailsApi.util.updateQueryData("getContentDetails", arg, (draft) =>
      applyDetailsPatch(draft, change),
    ),
  ) as { undo: () => void };
  return () => patch.undo();
}

function readCachedDetails(
  getState: () => unknown,
  mediaType: ContentMediaType,
  id: string,
) {
  const state = getState() as RootState;
  return contentDetailsApi.endpoints.getContentDetails.select({
    mediaType,
    id,
  })(state).data;
}

export const contentDetailsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getContentDetails: build.query<
      ContentDetailsData,
      { mediaType: ContentMediaType; id: string }
    >({
      query: ({ mediaType, id }) => ({
        url: `/api/${mediaType}/${id}`,
        cache: "no-store",
      }),
      providesTags: (_result, _error, arg) => [
        { type: "ContentDetails", id: `${arg.mediaType}:${arg.id}` },
      ],
    }),
    mutateContentDetails: build.mutation<MutationResponse, ContentMutationArg>({
      queryFn: async ({ id, mediaType, mutation, value, progress }) => {
        const method =
          mutation === "add-watchlist"
            ? "POST"
            : mutation === "remove-watchlist"
              ? "DELETE"
              : "PATCH";
        const body =
          mutation === "update-impression"
            ? { impression: value }
            : mutation === "update-watch-status"
              ? { watch_status: value }
              : mutation === "update-progress" && progress
                ? {
                    mark_season_to_watched: progress.seasonNumber,
                    mark_episode_to_watched: progress.episodeNumber,
                  }
                : undefined;

        if (
          mutation === "update-progress" &&
          (!progress || mediaType !== "series")
        ) {
          return {
            error: {
              status: 400,
              message: "Series progress details are unavailable",
            },
          };
        }

        try {
          const response = await apiFetch(`/api/${mediaType}/${id}`, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          });
          const data = (await response.json()) as MutationResponse;
          if (!response.ok) {
            return {
              error: {
                status: response.status,
                message: data.error ?? "Content update failed",
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
                  : "Content update failed",
            },
          };
        }
      },
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        const { id, mediaType, mutation, value, progress } = arg;
        let previousSeasonEpisodesWatched: number | undefined;
        if (
          mutation === "update-progress" &&
          progress &&
          mediaType === "series"
        ) {
          const cached = readCachedDetails(getState, mediaType, id);
          if (cached && "seasons" in cached && Array.isArray(cached.seasons)) {
            const season = cached.seasons.find(
              (item) => item.season_number === progress.seasonNumber,
            );
            previousSeasonEpisodesWatched = season?.episodes_watched ?? 0;
          }
        }
        try {
          const { data } = await queryFulfilled;
          const tmdbId = Number(id);

          if (mutation === "add-watchlist") {
            patchCachedContentDetails(dispatch, getState, {
              mediaType,
              id,
              replace: data,
            });
            if (mediaType === "movie") {
              const { patchCachedFranchiseDetails } =
                await import("./franchises-api");
              patchCachedFranchiseDetails(dispatch, getState, {
                tmdbId,
                add: true,
              });
            }
            dispatch(
              libraryApi.util.invalidateTags([...libraryTagIds, "Franchise"]),
            );
            dispatch(
              showToast({
                message: "Added to your watchlist",
                variant: "success",
              }),
            );
            return;
          }

          if (mutation === "remove-watchlist") {
            patchCachedContentDetails(dispatch, getState, {
              mediaType,
              id,
              remove: true,
            });
            patchLibraryCaches(dispatch, getState, {
              mediaType,
              tmdbId,
              remove: true,
            });
            if (mediaType === "movie") {
              const { patchCachedFranchiseDetails } =
                await import("./franchises-api");
              patchCachedFranchiseDetails(dispatch, getState, {
                tmdbId,
                remove: true,
              });
            }
            dispatch(
              libraryApi.util.invalidateTags([...libraryTagIds, "Franchise"]),
            );
            dispatch(
              showToast({
                message: "Removed from your watchlist",
                variant: "success",
              }),
            );
            return;
          }

          patchCachedContentDetails(dispatch, getState, {
            mediaType,
            id,
            fields: data,
          });

          if (mediaType === "movie" && typeof data.watch_status === "number") {
            const { patchCachedFranchiseDetails } =
              await import("./franchises-api");
            patchCachedFranchiseDetails(dispatch, getState, {
              tmdbId,
              watch_status: data.watch_status,
            });
          }

          const seriesUpdate: SeriesProgressFields | undefined =
            mediaType === "series" && data.seasons
              ? {
                  watch_status: data.watch_status ?? null,
                  impression: data.impression ?? null,
                  total_number_of_episodes_watched:
                    data.total_number_of_episodes_watched ?? 0,
                  total_number_of_seasons_watched:
                    data.total_number_of_seasons_watched ?? 0,
                  seasons: data.seasons.flatMap((season) =>
                    season.season_number === undefined
                      ? []
                      : [
                          {
                            season_number: season.season_number,
                            episode_count: season.episode_count ?? 0,
                            episodes_watched: season.episodes_watched,
                          },
                        ],
                  ),
                }
              : undefined;

          patchLibraryCaches(dispatch, getState, {
            mediaType,
            tmdbId,
            watch_status:
              typeof data.watch_status === "number"
                ? data.watch_status
                : undefined,
            impression: data.impression,
            seriesUpdate,
          });
          dispatch(
            libraryApi.util.invalidateTags([...libraryTagIds, "Franchise"]),
          );

          const current = readCachedDetails(getState, mediaType, id);
          const title =
            current && "title" in current && current.title
              ? current.title
              : current && "name" in current && current.name
                ? current.name
                : "this title";

          if (
            mutation === "update-watch-status" ||
            mutation === "update-progress"
          ) {
            const prompt = completionImpressionPrompt({
              mediaType,
              tmdbId,
              title,
              source: "details",
              impression: data.impression,
              requestedWatchStatus:
                mutation === "update-watch-status" && typeof value === "number"
                  ? value
                  : undefined,
              requestedProgress: progress,
              seasons: data.seasons,
              resultingWatchStatus: data.watch_status,
            });
            if (prompt) dispatch(impressionPromptRequested(prompt));
          } else if (mutation === "update-impression") {
            dispatch(impressionPromptResolved({ mediaType, tmdbId }));
          }

          if (mutation === "update-progress" && progress) {
            const season = data.seasons?.find(
              (item) => item.season_number === progress.seasonNumber,
            );
            const isSeasonCompleted = season
              ? season.episodes_watched >= (season.episode_count ?? 0)
              : false;
            const isUnmark =
              previousSeasonEpisodesWatched !== undefined &&
              progress.episodeNumber < previousSeasonEpisodesWatched;
            const message = isUnmark
              ? `Episode ${previousSeasonEpisodesWatched} unmarked`
              : isSeasonCompleted
                ? `Season ${progress.seasonNumber} completed!`
                : `Episode ${progress.episodeNumber} marked as completed`;
            dispatch(
              showToast({
                message,
                variant: "success",
              }),
            );
          } else if (mutation === "update-watch-status") {
            const statusName =
              Object.values(WATCH_STATUS).find((item) => item.value === value)
                ?.display_value ?? "Status";
            dispatch(
              showToast({
                message: `Status updated to ${statusName}`,
                variant: "success",
              }),
            );
          } else if (mutation === "update-impression") {
            if (value === null || value === undefined) {
              dispatch(
                showToast({ message: "Impression removed", variant: "info" }),
              );
            } else {
              const impressionName =
                Object.values(IMPRESSION).find((item) => item.value === value)
                  ?.display_value ?? "Reaction";
              dispatch(
                showToast({
                  message: `Impression updated to ${impressionName}`,
                  variant: "success",
                }),
              );
            }
          }
        } catch (caught) {
          const message = settledErrorMessage(caught, "Content update failed");
          if (mutation === "update-impression") {
            dispatch(
              impressionPromptFailed({
                mediaType,
                tmdbId: Number(id),
                error: message,
              }),
            );
          }
          dispatch(showToast({ message, variant: "error" }));
        }
      },
    }),
  }),
});

export function submitContentMutation(
  dispatch: AppDispatch,
  input: ContentMutationArg,
) {
  const key = `${input.mediaType}:${input.id}`;
  const existing = inflightMutations.get(key);
  if (existing) return existing;

  const request = dispatch(
    contentDetailsApi.endpoints.mutateContentDetails.initiate(input, {
      fixedCacheKey: `content-${input.mediaType}-${input.id}`,
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

export const { useGetContentDetailsQuery, useMutateContentDetailsMutation } =
  contentDetailsApi;
