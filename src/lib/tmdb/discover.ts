import { cachedTmdbFetch } from "@/lib/tmdb/cache";
import { tmdbFetch } from "@/lib/tmdb/client";

export type TmdbDiscoverResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  original_language?: string;
  // Present on TV results only.
  origin_country?: string[];
  // Present on /trending/all results only.
  media_type?: string;
};

export type TmdbListResponse = {
  results?: TmdbDiscoverResult[];
  total_pages?: number;
};

export type TmdbDiscoverPage = {
  results: TmdbDiscoverResult[];
  totalPages: number;
};

export type DiscoverTitlesParams = {
  type: "movie" | "tv";
  genreIds: number[];
  language?: string;
  minRating?: number | null;
  // Release-date window (inclusive), derived from the selected era buckets.
  gteYear?: number | null;
  lteYear?: number | null;
  // Exact release window (YYYY-MM-DD); takes precedence over the year bounds.
  gteDate?: string | null;
  lteDate?: string | null;
  sortBy?: "popularity.desc" | "vote_average.desc";
  // Overrides the default vote floor that accompanies a rating filter.
  minVoteCount?: number | null;
  maxVoteCount?: number | null;
  page?: number;
};

export function toTmdbPage(data: TmdbListResponse): TmdbDiscoverPage {
  return { results: data.results ?? [], totalPages: data.total_pages ?? 1 };
}

function buildDiscoverSearch(params: DiscoverTitlesParams): URLSearchParams {
  const search = new URLSearchParams({
    include_adult: "false",
    language: "en-US",
    sort_by: params.sortBy ?? "popularity.desc",
    page: String(params.page ?? 1),
  });
  if (params.genreIds.length > 0) {
    // pipe = OR, so any chosen genre matches
    search.set("with_genres", params.genreIds.join("|"));
  }
  if (params.language) {
    search.set("with_original_language", params.language);
  }
  const hasRating = params.minRating != null && params.minRating > 0;
  if (hasRating) {
    search.set("vote_average.gte", String(params.minRating));
  }
  // Rating filters are noisy without a vote floor, so require a baseline of
  // votes — otherwise a single 10/10 vote outranks everything.
  const voteFloor = params.minVoteCount ?? (hasRating ? 50 : null);
  if (voteFloor != null) {
    search.set("vote_count.gte", String(voteFloor));
  }
  if (params.maxVoteCount != null) {
    search.set("vote_count.lte", String(params.maxVoteCount));
  }
  // `discover` uses different date fields per media type.
  const gteField =
    params.type === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
  const lteField =
    params.type === "movie" ? "primary_release_date.lte" : "first_air_date.lte";
  const gte =
    params.gteDate ??
    (params.gteYear != null ? `${params.gteYear}-01-01` : null);
  const lte =
    params.lteDate ??
    (params.lteYear != null ? `${params.lteYear}-12-31` : null);
  if (gte) search.set(gteField, gte);
  if (lte) search.set(lteField, lte);
  return search;
}

export async function discoverTitles(
  params: DiscoverTitlesParams,
): Promise<TmdbDiscoverResult[]> {
  const data = await tmdbFetch<TmdbListResponse>(`/discover/${params.type}`, {
    searchParams: buildDiscoverSearch(params),
    failedMessage: "TMDB discover request failed",
  });
  return data.results ?? [];
}

export async function discoverTitlesPage(
  params: DiscoverTitlesParams,
  revalidateSeconds: number,
): Promise<TmdbDiscoverPage> {
  const data = await cachedTmdbFetch<TmdbListResponse>(
    `/discover/${params.type}`,
    buildDiscoverSearch(params),
    revalidateSeconds,
    "TMDB discover request failed",
  );
  return toTmdbPage(data);
}
