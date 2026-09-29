import {
  DISCOVER_MAX_PAGE,
  DISCOVER_MIN_ROW_ITEMS,
  DISCOVER_SEED_LIMIT,
  DISCOVER_TTL_SECONDS,
} from "@/lib/constants";
import {
  buildDiscoverPlan,
  parseRowKey,
  rowRequest,
  type DiscoverRowSpec,
  type RowPrefs,
} from "@/lib/discover/plan";
import { AppError, isAppError } from "@/lib/http/errors";
import { getYearString } from "@/lib/media/display";
import {
  discoverTitlesPage,
  type TmdbDiscoverPage,
  type TmdbDiscoverResult,
} from "@/lib/tmdb/discover";
import { fetchRecommendationsPage } from "@/lib/tmdb/recommendations";
import { fetchTrendingPage } from "@/lib/tmdb/trending";
import {
  findDiscoverLibraryEntries,
  findRecommendationSeeds,
} from "@/repositories/dashboard";
import { findGenreNamesByTmdbIds } from "@/repositories/genres";
import { loadUserPreferences } from "@/repositories/preferences";
import type {
  DiscoverMedia,
  DiscoverResponse,
  DiscoverRow,
  DiscoverRowPage,
  DiscoverTitle,
} from "@/lib/types";

// Movie 123 and series 123 are different titles.
function titleKey(title: DiscoverTitle): string {
  return `${title.mediaType}-${title.tmdbId}`;
}

function toDiscoverTitle(
  result: TmdbDiscoverResult,
  media: DiscoverMedia | null,
): DiscoverTitle | null {
  const resolved: DiscoverMedia | null =
    media ??
    (result.media_type === "movie"
      ? "movie"
      : result.media_type === "tv"
        ? "series"
        : null);
  const title = (result.title ?? result.name ?? "").trim();
  if (!resolved || !title) return null;
  const releaseDate = result.release_date || result.first_air_date || null;

  return {
    tmdbId: result.id,
    mediaType: resolved === "movie" ? 0 : 1,
    title,
    // Raw TMDB path; MediaCard falls back to FALLBACK_POSTER when null.
    posterPath: result.poster_path,
    year: getYearString(releaseDate ?? undefined) || null,
    rating: result.vote_average ?? null,
    releaseDate,
    originalLanguage: result.original_language ?? null,
    originCountry: result.origin_country?.[0] ?? null,
    watchStatus: null,
  };
}

async function fetchRowPage(
  spec: DiscoverRowSpec,
  prefs: RowPrefs,
  page: number,
): Promise<{ titles: DiscoverTitle[]; hasMore: boolean }> {
  const request = rowRequest(spec, prefs);
  let data: TmdbDiscoverPage;
  if (request.source === "trending") {
    data = await fetchTrendingPage(
      request.media,
      page,
      DISCOVER_TTL_SECONDS.trending,
    );
  } else if (request.source === "recommendations") {
    data = await fetchRecommendationsPage(
      request.media,
      request.tmdbId,
      page,
      DISCOVER_TTL_SECONDS.recommendations,
    );
  } else {
    data = await discoverTitlesPage(
      { ...request.params, page },
      DISCOVER_TTL_SECONDS.discover,
    );
  }

  const media = spec.media === "all" ? null : spec.media;
  const seen = new Set<string>();
  const titles: DiscoverTitle[] = [];
  for (const result of data.results) {
    const title = toDiscoverTitle(result, media);
    if (!title || seen.has(titleKey(title))) continue;
    seen.add(titleKey(title));
    titles.push(title);
  }
  return {
    titles,
    hasMore: page < Math.min(data.totalPages, DISCOVER_MAX_PAGE),
  };
}

// Runs after the TMDB cache, so statuses are always current. Library rows
// also supply the origin country TMDB omits for movies.
async function attachWatchStatus(userId: number, titles: DiscoverTitle[]) {
  const idsFor = (mediaType: 0 | 1) => [
    ...new Set(
      titles
        .filter((title) => title.mediaType === mediaType)
        .map((title) => title.tmdbId),
    ),
  ];
  const entries = await findDiscoverLibraryEntries(
    userId,
    idsFor(0),
    idsFor(1),
  );
  for (const title of titles) {
    const entry = entries.get(`${title.mediaType}-${title.tmdbId}`);
    title.watchStatus = entry?.watchStatus ?? null;
    title.originCountry = title.originCountry ?? entry?.originCountry ?? null;
  }
}

export async function getDiscoverRows(
  userId: number,
): Promise<DiscoverResponse> {
  const prefs = await loadUserPreferences(userId);
  if (!prefs || prefs.discoverRowsEnabled === false) {
    return { enabled: false, rows: [] };
  }

  const [seeds, genreRows] = await Promise.all([
    findRecommendationSeeds(userId, DISCOVER_SEED_LIMIT),
    findGenreNamesByTmdbIds(prefs.genreIds),
  ]);
  const plan = buildDiscoverPlan({
    prefs,
    seeds,
    genreNames: new Map(genreRows.map((genre) => [genre.tmdbId, genre.name])),
  });

  const settled = await Promise.allSettled(
    plan.map((row) => fetchRowPage(row.spec, prefs, 1)),
  );

  const failures: unknown[] = [];
  const shown = new Set<string>();
  const rows: DiscoverRow[] = [];
  settled.forEach((result, index) => {
    const planned = plan[index];
    if (result.status === "rejected") {
      failures.push(result.reason);
      console.error(`Discover row ${planned.key} failed`, result.reason);
      return;
    }
    const items = result.value.titles.filter(
      (title) => !shown.has(titleKey(title)),
    );
    if (items.length < DISCOVER_MIN_ROW_ITEMS) return;
    for (const title of items) shown.add(titleKey(title));
    rows.push({
      key: planned.key,
      kind: planned.spec.kind,
      title: planned.title,
      mediaType: planned.spec.media === "all" ? "mixed" : planned.spec.media,
      items,
      hasMore: result.value.hasMore,
    });
  });

  // Nothing to show and at least one row failed: surface the error so the
  // user gets Retry instead of a silently empty section.
  if (rows.length === 0 && failures.length > 0) {
    // Keep TMDB's own status (503 missing key, 429 rate limit) when known.
    const [first] = failures;
    throw isAppError(first)
      ? first
      : new AppError("Couldn't load recommendations", 502);
  }

  await attachWatchStatus(
    userId,
    rows.flatMap((row) => row.items),
  );
  return { enabled: true, rows };
}

export async function getDiscoverRowPage(
  userId: number,
  key: string,
  page: number,
): Promise<DiscoverRowPage> {
  const spec = parseRowKey(key);
  if (!spec) throw new AppError("Invalid discover row", 400);

  const prefs = await loadUserPreferences(userId);
  if (!prefs) throw new AppError("Preferences not found", 404);

  const { titles, hasMore } = await fetchRowPage(spec, prefs, page);
  await attachWatchStatus(userId, titles);
  return { items: titles, page, hasMore };
}
