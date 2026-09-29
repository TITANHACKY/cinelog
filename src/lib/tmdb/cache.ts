import { unstable_cache } from "next/cache";
import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbMovie, TmdbSeries } from "@/lib/types";

const TMDB_DETAIL_REVALIDATE_SECONDS = 43_200;

async function fetchTmdbMovieRaw(tmdbId: number) {
  const queryParams = new URLSearchParams({
    append_to_response: "release_dates,credits",
    language: "en-US",
  });

  return tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`, {
    searchParams: queryParams,
    failedMessage: "TMDB movie request failed",
  });
}

async function fetchTmdbSeriesRaw(tmdbId: number) {
  const queryParams = new URLSearchParams({
    append_to_response: "external_ids,content_ratings,credits",
    language: "en-US",
  });

  return tmdbFetch<TmdbSeries>(`/tv/${tmdbId}`, {
    searchParams: queryParams,
    failedMessage: "TMDB series request failed",
  });
}

export async function getCachedTmdbMovie(tmdbId: number) {
  return unstable_cache(
    async () => fetchTmdbMovieRaw(tmdbId),
    ["tmdb-movie", String(tmdbId)],
    { revalidate: TMDB_DETAIL_REVALIDATE_SECONDS },
  )();
}

export async function getCachedTmdbSeries(tmdbId: number) {
  return unstable_cache(
    async () => fetchTmdbSeriesRaw(tmdbId),
    ["tmdb-series", String(tmdbId)],
    { revalidate: TMDB_DETAIL_REVALIDATE_SECONDS },
  )();
}

// Cached TMDB list request shared by every user who asks for the same
// path + params. Params are sorted so equivalent requests share one entry.
export async function cachedTmdbFetch<T>(
  path: string,
  searchParams: URLSearchParams,
  revalidateSeconds: number,
  failedMessage: string,
): Promise<T> {
  const sorted = new URLSearchParams(
    [...searchParams.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
  return unstable_cache(
    async () => tmdbFetch<T>(path, { searchParams: sorted, failedMessage }),
    ["tmdb-list", path, sorted.toString()],
    { revalidate: revalidateSeconds },
  )();
}
