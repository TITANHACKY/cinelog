import { tmdbFetch } from "@/lib/tmdb/client";

export type TmdbDiscoverResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

type TmdbDiscoverResponse = { results?: TmdbDiscoverResult[] };

export async function discoverTitles(params: {
  type: "movie" | "tv";
  genreIds: number[];
  language?: string;
  minRating?: number | null;
  // Release-date window (inclusive), derived from the selected era buckets.
  gteYear?: number | null;
  lteYear?: number | null;
}): Promise<TmdbDiscoverResult[]> {
  const search = new URLSearchParams({
    include_adult: "false",
    language: "en-US",
    sort_by: "popularity.desc",
    page: "1",
  });
  if (params.genreIds.length > 0) {
    // pipe = OR, so any chosen genre matches
    search.set("with_genres", params.genreIds.join("|"));
  }
  if (params.language) {
    search.set("with_original_language", params.language);
  }
  if (params.minRating != null && params.minRating > 0) {
    search.set("vote_average.gte", String(params.minRating));
    // Rating filters are noisy without a vote floor, so require a baseline of
    // votes — otherwise a single 10/10 vote outranks everything.
    search.set("vote_count.gte", "50");
  }
  // `discover` uses different date fields per media type.
  const gteField =
    params.type === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
  const lteField =
    params.type === "movie" ? "primary_release_date.lte" : "first_air_date.lte";
  if (params.gteYear != null) {
    search.set(gteField, `${params.gteYear}-01-01`);
  }
  if (params.lteYear != null) {
    search.set(lteField, `${params.lteYear}-12-31`);
  }

  const data = await tmdbFetch<TmdbDiscoverResponse>(`/discover/${params.type}`, {
    searchParams: search,
    failedMessage: "TMDB discover request failed",
  });
  return data.results ?? [];
}
