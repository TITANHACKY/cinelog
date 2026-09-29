import { DISCOVER_TTL_SECONDS } from "@/lib/constants";
import { cachedTmdbFetch } from "@/lib/tmdb/cache";

type TmdbKeyword = { id?: number };
// Movies answer with `keywords`, series with `results`.
type TmdbKeywordsResponse = {
  keywords?: TmdbKeyword[];
  results?: TmdbKeyword[];
};

export async function fetchTitleKeywords(
  media: "movie" | "tv",
  tmdbId: number,
): Promise<number[]> {
  const data = await cachedTmdbFetch<TmdbKeywordsResponse>(
    `/${media}/${tmdbId}/keywords`,
    new URLSearchParams(),
    DISCOVER_TTL_SECONDS.keywords,
    "TMDB keywords request failed",
  );
  return (data.keywords ?? data.results ?? [])
    .map((keyword) => keyword.id)
    .filter((id): id is number => typeof id === "number");
}
