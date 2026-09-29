import type { TitleCandidate, UserPreferencesInput } from "@/lib/types";
import type { User } from "@/store/slices/authSlice";
import { baseApi, libraryTagIds } from "@/store/api/base-api";

export type TitleSuggestionArgs = {
  mediaLean: number;
  genreIds?: number[];
  languages?: string[];
  eras?: string[];
  minRating?: number | null;
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPreferences: build.query<UserPreferencesInput | null, void>({
      query: () => ({ url: "/api/user/preferences" }),
      transformResponse: (response: {
        preferences: UserPreferencesInput | null;
      }) => response.preferences,
      providesTags: ["Preferences"],
    }),
    updatePreferences: build.mutation<
      { success: boolean },
      UserPreferencesInput
    >({
      query: (body) => ({ url: "/api/user/preferences", method: "PUT", body }),
      invalidatesTags: ["Preferences", "Me", "Discover"],
    }),
    updateProfile: build.mutation<{ user: User }, Record<string, unknown>>({
      query: (body) => ({ url: "/api/user/profile", method: "PATCH", body }),
      invalidatesTags: (_result, _error, body) =>
        "discoverRowsEnabled" in body
          ? ["Me", "Dashboard", "Collections", "CollectionCarousel", "Discover"]
          : ["Me", "Dashboard", "Collections", "CollectionCarousel"],
    }),
    getTitleSuggestions: build.query<
      { titles: TitleCandidate[] },
      TitleSuggestionArgs
    >({
      query: ({ mediaLean, genreIds, languages, eras, minRating }) => {
        const params = new URLSearchParams({ mediaType: String(mediaLean) });
        if (genreIds?.length) params.set("genres", genreIds.join(","));
        if (languages?.length) params.set("languages", languages.join(","));
        if (eras?.length) params.set("eras", eras.join(","));
        if (minRating != null) params.set("minRating", String(minRating));
        return {
          url: `/api/onboarding/title-suggestions?${params.toString()}`,
        };
      },
    }),
    addTitle: build.mutation<
      unknown,
      { mediaType: "movie" | "series"; tmdbId: number }
    >({
      query: ({ mediaType, tmdbId }) => ({
        url: `/api/${mediaType}/${tmdbId}`,
        method: "POST",
      }),
      invalidatesTags: [...libraryTagIds],
    }),
  }),
});

export const {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useUpdateProfileMutation,
  useGetTitleSuggestionsQuery,
  useAddTitleMutation,
} = userApi;
