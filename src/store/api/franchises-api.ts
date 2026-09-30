import { FRANCHISES_PAGE_SIZE } from "@/lib/constants/library";
import { WATCH_STATUS } from "@/lib/constants";
import {
  calculateFranchiseProgress,
  progressFromCounts,
  toFranchiseProgressApi,
} from "@/lib/media/franchise-progress";
import { apiFetch } from "@/lib/http/client";
import { baseApi } from "@/store/api/base-api";

export type FranchiseProgressData = {
  watched_count: number;
  total_count: number;
  percentage: number;
};

export type FranchisePartItem = {
  id: number;
  title?: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  is_present_in_watchlist?: boolean;
  watch_status?: number | null;
  original_language?: string | null;
};

export type FranchiseDetailsData = {
  id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  is_following: boolean;
  progress: FranchiseProgressData;
  parts: FranchisePartItem[];
};

export type FollowedFranchiseItem = {
  id: number;
  name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  followed_at: string | null;
  progress: FranchiseProgressData;
};

export type FollowedFranchisesData = {
  franchises: FollowedFranchiseItem[];
  total_count: number;
  has_more: boolean;
};

export type FollowedFranchisesQueryArgs = {
  q?: string;
  sortBy?: "name" | "followed_at";
  sortOrder?: "asc" | "desc";
};

// RTK's updateQueryData thunk is generic over the whole api state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppDispatch = (action: any) => any;
type RootState = Parameters<
  typeof franchisesApi.util.selectCachedArgsForQuery
>[0];

const COMPLETED_WATCH_STATUS = WATCH_STATUS[2].value;

function recomputeFranchiseProgress(parts: FranchisePartItem[]) {
  return toFranchiseProgressApi(calculateFranchiseProgress(parts));
}

function patchFranchisePartsProgress(draft: {
  parts: FranchisePartItem[];
  progress?: FranchiseProgressData;
}) {
  draft.progress = recomputeFranchiseProgress(draft.parts);
}

function adjustStoredFranchiseProgress(
  progress: FranchiseProgressData,
  previousStatus: number | null | undefined,
  nextStatus: number | null | undefined,
) {
  const wasCompleted = previousStatus === COMPLETED_WATCH_STATUS;
  const isCompleted = nextStatus === COMPLETED_WATCH_STATUS;

  if (!wasCompleted && isCompleted) {
    progress.watched_count += 1;
  } else if (wasCompleted && !isCompleted) {
    progress.watched_count = Math.max(0, progress.watched_count - 1);
  } else {
    return;
  }

  progress.percentage = progressFromCounts(
    progress.watched_count,
    progress.total_count,
  ).percentage;
}

function patchFollowedFranchiseProgress(
  dispatch: AppDispatch,
  getState: () => unknown,
  franchiseTmdbId: number,
  previousStatus: number | null | undefined,
  nextStatus: number | null | undefined,
) {
  const state = getState() as RootState;
  const undos: Array<() => void> = [];

  for (const arg of franchisesApi.util.selectCachedArgsForQuery(
    state,
    "getFollowedFranchises",
  )) {
    const patch = dispatch(
      franchisesApi.util.updateQueryData(
        "getFollowedFranchises",
        arg,
        (draft) => {
          const franchise = draft.franchises.find(
            (item) => item.id === franchiseTmdbId,
          );
          if (!franchise?.progress) {
            return;
          }

          adjustStoredFranchiseProgress(
            franchise.progress,
            previousStatus,
            nextStatus,
          );
        },
      ),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  return undos;
}

export function patchCachedFranchiseDetails(
  dispatch: AppDispatch,
  getState: () => unknown,
  change: {
    tmdbId: number;
    watch_status?: number | null;
    remove?: boolean;
    add?: boolean;
  },
) {
  const state = getState() as RootState;
  const undos: Array<() => void> = [];

  for (const arg of franchisesApi.util.selectCachedArgsForQuery(
    state,
    "getFranchiseDetails",
  )) {
    const patch = dispatch(
      franchisesApi.util.updateQueryData(
        "getFranchiseDetails",
        arg,
        (draft) => {
          const part = draft.parts?.find((p) => p.id === change.tmdbId);
          if (!part) return;

          const previousStatus = part.watch_status;

          if (change.remove) {
            part.is_present_in_watchlist = false;
            part.watch_status = null;
          } else if (change.add) {
            part.is_present_in_watchlist = true;
            if (part.watch_status === null || part.watch_status === undefined) {
              part.watch_status = 0;
            }
          } else if (change.watch_status !== undefined) {
            part.watch_status = change.watch_status;
            part.is_present_in_watchlist = true;
          }

          if (draft.progress) {
            adjustStoredFranchiseProgress(
              draft.progress,
              previousStatus,
              part.watch_status,
            );
          } else {
            patchFranchisePartsProgress(draft);
          }

          const followedUndos = patchFollowedFranchiseProgress(
            dispatch,
            getState,
            draft.id,
            previousStatus,
            part.watch_status,
          );
          undos.push(...followedUndos);
        },
      ),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  return undos;
}

export const franchisesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFranchiseDetails: build.query<FranchiseDetailsData, { id: number }>({
      query: ({ id }) => ({
        url: `/api/franchises/${id}`,
      }),
      providesTags: (_result, _error, arg) => [
        { type: "Franchise", id: arg.id },
      ],
    }),
    followFranchise: build.mutation<
      { success: boolean; is_following: boolean },
      { id: number }
    >({
      query: ({ id }) => ({
        url: `/api/franchises/${id}/follow`,
        method: "POST",
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        const undos: Array<() => void> = [];

        const patchDetails = dispatch(
          franchisesApi.util.updateQueryData(
            "getFranchiseDetails",
            { id },
            (draft) => {
              draft.is_following = true;
              for (const part of draft.parts) {
                part.is_present_in_watchlist = true;
                if (
                  part.watch_status === null ||
                  part.watch_status === undefined
                ) {
                  part.watch_status = 0;
                }
              }
              patchFranchisePartsProgress(draft);
            },
          ),
        ) as { undo: () => void };
        undos.push(() => patchDetails.undo());

        try {
          const { patchCachedContentDetails, contentDetailsApi } =
            await import("./content-details-api");
          const state = getState() as RootState;
          const cachedFranchise =
            franchisesApi.endpoints.getFranchiseDetails.select({ id })(
              state,
            ).data;

          if (cachedFranchise?.parts) {
            for (const part of cachedFranchise.parts) {
              const detailsUndo = patchCachedContentDetails(
                dispatch,
                getState,
                {
                  mediaType: "movie",
                  id: String(part.id),
                  fields: {
                    is_present_in_watchlist: true,
                    watch_status: 0,
                  },
                },
              );
              if (detailsUndo) undos.push(detailsUndo);
            }
          }

          const contentArgs = contentDetailsApi.util.selectCachedArgsForQuery(
            state as unknown as Parameters<
              typeof contentDetailsApi.util.selectCachedArgsForQuery
            >[0],
            "getContentDetails",
          );
          for (const arg of contentArgs) {
            const patch = dispatch(
              contentDetailsApi.util.updateQueryData(
                "getContentDetails",
                arg,
                (draft) => {
                  if (
                    "franchise" in draft &&
                    draft.franchise &&
                    draft.franchise.id === id
                  ) {
                    draft.franchise.is_following = true;
                  }
                },
              ),
            ) as { undo: () => void };
            undos.push(() => patch.undo());
          }
        } catch {
          // ignore dynamic import errors
        }

        try {
          await queryFulfilled;
        } catch {
          for (const undo of undos) undo();
        }
      },
      invalidatesTags: ["Franchises", "Library", "Dashboard"],
    }),
    unfollowFranchise: build.mutation<
      { success: boolean; is_following: boolean },
      { id: number }
    >({
      query: ({ id }) => ({
        url: `/api/franchises/${id}/follow`,
        method: "DELETE",
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        const undos: Array<() => void> = [];

        const patchDetails = dispatch(
          franchisesApi.util.updateQueryData(
            "getFranchiseDetails",
            { id },
            (draft) => {
              draft.is_following = false;
            },
          ),
        ) as { undo: () => void };
        undos.push(() => patchDetails.undo());

        const state = getState() as RootState;
        for (const arg of franchisesApi.util.selectCachedArgsForQuery(
          state,
          "getFollowedFranchises",
        )) {
          const patchFollowed = dispatch(
            franchisesApi.util.updateQueryData(
              "getFollowedFranchises",
              arg,
              (draft) => {
                const index = draft.franchises.findIndex((f) => f.id === id);
                if (index !== -1) {
                  draft.franchises.splice(index, 1);
                  draft.total_count = Math.max(0, draft.total_count - 1);
                }
              },
            ),
          ) as { undo: () => void };
          undos.push(() => patchFollowed.undo());
        }

        try {
          const { contentDetailsApi } = await import("./content-details-api");
          const contentArgs = contentDetailsApi.util.selectCachedArgsForQuery(
            state as unknown as Parameters<
              typeof contentDetailsApi.util.selectCachedArgsForQuery
            >[0],
            "getContentDetails",
          );
          for (const arg of contentArgs) {
            const patch = dispatch(
              contentDetailsApi.util.updateQueryData(
                "getContentDetails",
                arg,
                (draft) => {
                  if (
                    "franchise" in draft &&
                    draft.franchise &&
                    draft.franchise.id === id
                  ) {
                    draft.franchise.is_following = false;
                  }
                },
              ),
            ) as { undo: () => void };
            undos.push(() => patch.undo());
          }
        } catch {
          // ignore
        }

        try {
          await queryFulfilled;
        } catch {
          for (const undo of undos) undo();
        }
      },
      invalidatesTags: ["Franchises"],
    }),
    getFollowedFranchises: build.query<
      FollowedFranchisesData,
      FollowedFranchisesQueryArgs | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        params.set("limit", String(FRANCHISES_PAGE_SIZE));
        params.set("offset", "0");
        if (args?.q?.trim()) params.set("q", args.q.trim());
        if (args?.sortBy) params.set("sortBy", args.sortBy);
        if (args?.sortOrder) params.set("sortOrder", args.sortOrder);

        return {
          url: `/api/library/franchises?${params.toString()}`,
        };
      },
      transformResponse: (response: {
        franchises: FollowedFranchiseItem[];
        total_count?: number;
        has_more?: boolean;
      }) => ({
        franchises: response.franchises ?? [],
        total_count: response.total_count ?? response.franchises?.length ?? 0,
        has_more: Boolean(response.has_more),
      }),
      providesTags: ["Franchises"],
    }),
  }),
});

export async function loadMoreFollowedFranchises(
  dispatch: AppDispatch,
  offset: number,
  args?: FollowedFranchisesQueryArgs,
) {
  const params = new URLSearchParams();
  params.set("limit", String(FRANCHISES_PAGE_SIZE));
  params.set("offset", String(offset));
  if (args?.q?.trim()) params.set("q", args.q.trim());
  if (args?.sortBy) params.set("sortBy", args.sortBy);
  if (args?.sortOrder) params.set("sortOrder", args.sortOrder);

  const response = await apiFetch(
    `/api/library/franchises?${params.toString()}`,
  );
  const json = (await response.json()) as FollowedFranchisesData;
  if (!response.ok) {
    throw new Error("Failed to load more franchises");
  }
  dispatch(
    franchisesApi.util.updateQueryData(
      "getFollowedFranchises",
      args,
      (draft) => {
        const existingIds = new Set(draft.franchises.map((f) => f.id));
        for (const item of json.franchises) {
          if (!existingIds.has(item.id)) {
            draft.franchises.push(item);
            existingIds.add(item.id);
          }
        }
        draft.total_count = json.total_count;
        draft.has_more = json.has_more;
      },
    ),
  );
}

export const {
  useGetFranchiseDetailsQuery,
  useFollowFranchiseMutation,
  useUnfollowFranchiseMutation,
  useGetFollowedFranchisesQuery,
} = franchisesApi;
