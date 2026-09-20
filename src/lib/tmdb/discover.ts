import { tmdbFetch } from "@/lib/tmdb/client";

export type TmdbDiscoverResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
};

type TmdbDiscoverResponse = { results?: TmdbDiscoverResult[] };

export async function discoverTitles(params: {
  type: "movie" | "tv";
  genreIds: number[];
  language?: string;
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

  const data = await tmdbFetch<TmdbDiscoverResponse>(`/discover/${params.type}`, {
    searchParams: search,
    failedMessage: "TMDB discover request failed",
  });
  return data.results ?? [];
}
