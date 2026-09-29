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
      invalidatesTags: (_result, _error, arg) => [
        { type: "Franchise", id: arg.id },
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
      invalidatesTags: (_result, _error, arg) => [
        { type: "Franchise", id: arg.id },
        "Franchises",
      ],
    }),
    getFollowedFranchises: build.query<FollowedFranchiseItem[], void>({
      query: () => ({
        url: "/api/library/franchises",
      }),
      transformResponse: (response: { franchises: FollowedFranchiseItem[] }) =>
        response.franchises ?? [],
      providesTags: ["Franchises"],
    }),
  }),
});

export const {
  useGetFranchiseDetailsQuery,
  useFollowFranchiseMutation,
  useUnfollowFranchiseMutation,
  useGetFollowedFranchisesQuery,
} = franchisesApi;
