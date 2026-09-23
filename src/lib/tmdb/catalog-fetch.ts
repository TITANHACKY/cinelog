import { tmdbFetch } from "@/lib/tmdb/client";
import type {
  TmdbConfigurationCountry,
  TmdbConfigurationLanguage,
  TmdbGenreList,
  TmdbMovie,
  TmdbSeries,
} from "@/lib/types";

async function fetchTmdbGenreList(path: string, failedMessage: string) {
  const queryParams = new URLSearchParams({
    language: "en-US",
  });

  return tmdbFetch<TmdbGenreList>(path, {
    searchParams: queryParams,
    failedMessage,
  });
}

export async function fetchTmdbMovieGenres() {
  return fetchTmdbGenreList("/genre/movie/list", "TMDB movie genre list failed");
}

export async function fetchTmdbSeriesGenres() {
  return fetchTmdbGenreList("/genre/tv/list", "TMDB series genre list failed");
}

export async function fetchTmdbLanguages() {
  return tmdbFetch<TmdbConfigurationLanguage[]>("/configuration/languages", {
    failedMessage: "TMDB language list failed",
  });
}

export async function fetchTmdbCountries() {
  const queryParams = new URLSearchParams({
    language: "en-US",
  });

  return tmdbFetch<TmdbConfigurationCountry[]>("/configuration/countries", {
    searchParams: queryParams,
    failedMessage: "TMDB country list failed",
  });
}

export async function fetchTmdbMovieForCatalog(tmdbId: number) {
  const queryParams = new URLSearchParams({
    append_to_response: "release_dates",
    language: "en-US",
  });

  return tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`, {
    searchParams: queryParams,
    failedMessage: "TMDB movie request failed",
  });
}

export async function fetchTmdbSeriesForCatalog(tmdbId: number) {
  const queryParams = new URLSearchParams({
    append_to_response: "content_ratings",
    language: "en-US",
  });

  return tmdbFetch<TmdbSeries>(`/tv/${tmdbId}`, {
    searchParams: queryParams,
    failedMessage: "TMDB series request failed",
  });
}
