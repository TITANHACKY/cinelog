import type {
  DiscoverLayout,
  DiscoverResponse,
  DiscoverRowPage,
  DiscoverTitle,
  LibraryMediaType,
} from "@/lib/types";
import { baseApi } from "@/store/api/base-api";

export const discoverApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDiscover: build.query<DiscoverResponse, void>({
      query: () => ({ url: "/api/dashboard/discover" }),
      providesTags: ["Discover"],
    }),
    getDiscoverLayout: build.query<DiscoverLayout, void>({
      query: () => ({ url: "/api/dashboard/discover" }),
      providesTags: ["Discover"],
    }),

    getDiscoverRowPages: build.infiniteQuery<DiscoverRowPage, string, number>({
      infiniteQueryOptions: {
        // Every page, including page 1, comes from the row endpoint.
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
          lastPage.hasMore ? lastPage.page + 1 : undefined,
      },
      query: ({ queryArg: key, pageParam }) => ({
        url: `/api/dashboard/discover/rows/${encodeURIComponent(key)}?page=${pageParam}`,
      }),
      providesTags: ["Discover"],
    }),
  }),
});

export const {
  useGetDiscoverQuery,
  useGetDiscoverLayoutQuery,
  useGetDiscoverRowPagesInfiniteQuery,
} = discoverApi;

export type DiscoverChange = {
  mediaType: LibraryMediaType;
  tmdbId: number;
  // null = removed from the library
  watchStatus: number | null;
};

// RTK's updateQueryData thunk is generic over the whole api state, which this
// module cannot name without a circular import of the store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppDispatch = (action: any) => any;
type RootState = Parameters<
  typeof discoverApi.util.selectCachedArgsForQuery
>[0];

function patchItems(items: DiscoverTitle[], change: DiscoverChange) {
  const mediaType = change.mediaType === "movie" ? 0 : 1;
  for (const item of items) {
    if (item.tmdbId === change.tmdbId && item.mediaType === mediaType) {
      item.watchStatus = change.watchStatus;
    }
  }
}

// Update a title's status in every cached discover row without refetching,
// so rows never reshuffle under the user.
export function patchDiscoverCaches(
  dispatch: AppDispatch,
  getState: () => unknown,
  change: DiscoverChange,
) {
  const state = getState() as RootState;
  const undos: Array<() => void> = [];

  for (const arg of discoverApi.util.selectCachedArgsForQuery(
    state,
    "getDiscover",
  )) {
    const patch = dispatch(
      discoverApi.util.updateQueryData("getDiscover", arg, (draft) => {
        for (const row of draft.rows) patchItems(row.items, change);
      }),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  for (const arg of discoverApi.util.selectCachedArgsForQuery(
    state,
    "getDiscoverRowPages",
  )) {
    const patch = dispatch(
      discoverApi.util.updateQueryData("getDiscoverRowPages", arg, (draft) => {
        for (const page of draft.pages) patchItems(page.items, change);
      }),
    ) as { undo: () => void };
    undos.push(() => patch.undo());
  }

  return undos;
}
