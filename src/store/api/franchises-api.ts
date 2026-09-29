import { FRANCHISES_PAGE_SIZE } from "@/lib/constants/library";
import { apiFetch } from "@/lib/http/client";
import { baseApi } from "@/store/api/base-api";

export type FranchisePartItem = {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
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
  parts: FranchisePartItem[];
};

export type FollowedFranchiseItem = {
  id: number;
  tmdbId: number;
  name: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  followedAt: string | null;
};

export type FollowedFranchisesData = {
  franchises: FollowedFranchiseItem[];
  totalCount: number;
  hasMore: boolean;
};

// RTK's updateQueryData thunk is generic over the whole api state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppDispatch = (action: any) => any;
type RootState = Parameters<
  typeof franchisesApi.util.selectCachedArgsForQuery
>[0];

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
      franchisesApi.util.updateQueryData("getFranchiseDetails", arg, (draft) => {
        const part = draft.parts?.find((p) => p.id === change.tmdbId);
        if (!part) return;

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
      }),
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

        // 1. Optimistically update getFranchiseDetails
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
            },
          ),
        ) as { undo: () => void };
        undos.push(() => patchDetails.undo());

        // 2. Also patch matching contentDetailsApi entries if cached
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

          const contentArgs =
            contentDetailsApi.util.selectCachedArgsForQuery(
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
      // Note: we intentionally do not invalidate `{ type: "Franchise", id: arg.id }` here
      // because the backend adds movies asynchronously in an after-block; an immediate refetch
      // would overwrite this optimistic update before the background insertion finishes.
      invalidatesTags: [
        "Franchises",
        "Library",
        "Dashboard",
      ],
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

        const patchFollowed = dispatch(
          franchisesApi.util.updateQueryData(
            "getFollowedFranchises",
            undefined,
            (draft) => {
              const index = draft.franchises.findIndex((f) => f.tmdbId === id);
              if (index !== -1) {
                draft.franchises.splice(index, 1);
                draft.totalCount = Math.max(0, draft.totalCount - 1);
              }
            },
          ),
        ) as { undo: () => void };
        undos.push(() => patchFollowed.undo());

        try {
          const { contentDetailsApi } = await import("./content-details-api");
          const state = getState() as RootState;
          const contentArgs =
            contentDetailsApi.util.selectCachedArgsForQuery(
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
      invalidatesTags: [
        "Franchises",
      ],
    }),
    getFollowedFranchises: build.query<FollowedFranchisesData, void>({
      query: () => ({
        url: `/api/library/franchises?limit=${FRANCHISES_PAGE_SIZE}&offset=0`,
      }),
      transformResponse: (response: {
        franchises: FollowedFranchiseItem[];
        totalCount?: number;
        hasMore?: boolean;
      }) => ({
        franchises: response.franchises ?? [],
        totalCount: response.totalCount ?? (response.franchises?.length ?? 0),
        hasMore: Boolean(response.hasMore),
      }),
      providesTags: ["Franchises"],
    }),
  }),
});

export async function loadMoreFollowedFranchises(
  dispatch: AppDispatch,
  offset: number,
) {
  const response = await apiFetch(
    `/api/library/franchises?limit=${FRANCHISES_PAGE_SIZE}&offset=${offset}`,
  );
  const json = (await response.json()) as {
    franchises: FollowedFranchiseItem[];
    totalCount: number;
    hasMore: boolean;
  };
  if (!response.ok) {
    throw new Error("Failed to load more franchises");
  }
  dispatch(
    franchisesApi.util.updateQueryData(
      "getFollowedFranchises",
      undefined,
      (draft) => {
        const existingIds = new Set(draft.franchises.map((f) => f.id));
        for (const item of json.franchises) {
          if (!existingIds.has(item.id)) {
            draft.franchises.push(item);
            existingIds.add(item.id);
          }
        }
        draft.totalCount = json.totalCount;
        draft.hasMore = json.hasMore;
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
