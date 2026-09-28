import type { CountryOption, LanguageOption } from "@/lib/types";
import { baseApi } from "@/store/api/base-api";

export type GenreOption = {
  tmdb_id: number;
  name: string;
};

export type LocalesData = {
  languages: LanguageOption[];
  countries: CountryOption[];
};

export const referenceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getGenres: build.query<GenreOption[], void>({
      query: () => ({ url: "/api/genres" }),
      transformResponse: (response: { genres?: GenreOption[] }) =>
        response.genres ?? [],
      providesTags: ["Genres"],
      keepUnusedDataFor: 3600,
    }),
    getLocales: build.query<LocalesData, void>({
      query: () => ({ url: "/api/locales" }),
      providesTags: ["Locales"],
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetGenresQuery, useGetLocalesQuery } = referenceApi;
