import { cachedTmdbFetch } from "@/lib/tmdb/cache";
import {
  toTmdbPage,
  type TmdbDiscoverPage,
  type TmdbListResponse,
} from "@/lib/tmdb/discover";

export async function fetchRecommendationsPage(
  media: "movie" | "tv",
  tmdbId: number,
  page: number,
  revalidateSeconds: number,
): Promise<TmdbDiscoverPage> {
  const data = await cachedTmdbFetch<TmdbListResponse>(
    `/${media}/${tmdbId}/recommendations`,
    new URLSearchParams({ language: "en-US", page: String(page) }),
    revalidateSeconds,
    "TMDB recommendations request failed",
  );
  return toTmdbPage(data);
}
