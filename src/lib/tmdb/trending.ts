import { cachedTmdbFetch } from "@/lib/tmdb/cache";
import {
  toTmdbPage,
  type TmdbDiscoverPage,
  type TmdbListResponse,
} from "@/lib/tmdb/discover";

export async function fetchTrendingPage(
  media: "movie" | "tv" | "all",
  page: number,
  revalidateSeconds: number,
): Promise<TmdbDiscoverPage> {
  const data = await cachedTmdbFetch<TmdbListResponse>(
    `/trending/${media}/week`,
    new URLSearchParams({ language: "en-US", page: String(page) }),
    revalidateSeconds,
    "TMDB trending request failed",
  );
  const result = toTmdbPage(data);
  // /trending/all mixes in people; keep titles only.
  return media === "all"
    ? {
        ...result,
        results: result.results.filter(
          (item) => item.media_type === "movie" || item.media_type === "tv",
        ),
      }
    : result;
}
