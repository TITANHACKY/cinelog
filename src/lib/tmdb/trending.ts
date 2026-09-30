import { cachedTmdbFetch } from "@/lib/tmdb/cache";
import {
  toTmdbPage,
  type TmdbDiscoverPage,
  type TmdbListResponse,
} from "@/lib/tmdb/discover";

// TMDB's short-window momentum score; it can't filter by language, so
// callers filter the results.
export async function fetchTrendingPage(
  media: "movie" | "tv",
  page: number,
  revalidateSeconds: number,
): Promise<TmdbDiscoverPage> {
  const data = await cachedTmdbFetch<TmdbListResponse>(
    `/trending/${media}/week`,
    new URLSearchParams({ language: "en-US", page: String(page) }),
    revalidateSeconds,
    "TMDB trending request failed",
  );
  return toTmdbPage(data);
}
