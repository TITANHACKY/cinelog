import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbMovie, TmdbSeries } from "@/lib/types";

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
