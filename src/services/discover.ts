import {
  COMMON_LANGUAGES,
  DISCOVER_MAX_PAGE,
  DISCOVER_TTL_SECONDS,
} from "@/lib/constants";
import {
  buildRowParams,
  isRowAllowed,
  parseRowKey,
  toMediaGenre,
  type RowSpec,
  type SeedDetails,
} from "@/lib/discover/rows";
import { AppError } from "@/lib/http/errors";
import { getYearString } from "@/lib/media/display";
import { getCachedTmdbMovie, getCachedTmdbSeries } from "@/lib/tmdb/cache";
import {
  discoverTitlesPage,
  type TmdbDiscoverResult,
} from "@/lib/tmdb/discover";
import { fetchTitleKeywords } from "@/lib/tmdb/keywords";
import {
  findDiscoverLibraryEntries,
  findDiscoverSeed,
  isDiscoverSeedCandidate,
} from "@/repositories/dashboard";
import { findGenreNamesByTmdbIds } from "@/repositories/genres";
import { loadUserPreferences } from "@/repositories/preferences";
import type {
  DiscoverLayout,
  DiscoverMedia,
  DiscoverRowPage,
  DiscoverTitle,
} from "@/lib/types";

// Movie 123 and series 123 are different titles.
function titleKey(title: DiscoverTitle): string {
  return `${title.mediaType}-${title.tmdbId}`;
}

function toDiscoverTitle(
  result: TmdbDiscoverResult,
  media: DiscoverMedia,
): DiscoverTitle | null {
  const title = (result.title ?? result.name ?? "").trim();
  if (!title) return null;
  const releaseDate = result.release_date || result.first_air_date || null;

  return {
    tmdbId: result.id,
    mediaType: media === "movie" ? 0 : 1,
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
    const entry = entries.get(titleKey(title));
    title.watchStatus = entry?.watchStatus ?? null;
    title.originCountry = title.originCountry ?? entry?.originCountry ?? null;
  }
}

function languageLabel(code: string): string {
  return (
    COMMON_LANGUAGES.find((language) => language.code === code)?.label ??
    code.toUpperCase()
  );
}

export async function getDiscoverLayout(
  userId: number,
): Promise<DiscoverLayout> {
  const prefs = await loadUserPreferences(userId);
  if (!prefs || prefs.discoverRowsEnabled === false) return { enabled: false };

  const [genreRows, seed] = await Promise.all([
    findGenreNamesByTmdbIds(prefs.genreIds),
    findDiscoverSeed(userId),
  ]);
  const names = new Map(genreRows.map((genre) => [genre.tmdbId, genre.name]));

  return {
    enabled: true,
    mediaLean: prefs.mediaLean,
    genres: prefs.genreIds.map((id) => ({
      id,
      name: names.get(id) ?? `Genre ${id}`,
      movieId: toMediaGenre(id, "movie"),
      seriesId: toMediaGenre(id, "series"),
    })),
    languages: prefs.languages.map((code) => ({
      code,
      label: languageLabel(code),
    })),
    seed,
  };
}

async function loadSeedDetails(
  spec: Extract<RowSpec, { kind: "because" }>,
): Promise<SeedDetails> {
  const tmdbMedia = spec.media === "movie" ? "movie" : "tv";
  const [details, keywordIds] = await Promise.all([
    spec.media === "movie"
      ? getCachedTmdbMovie(spec.tmdbId)
      : getCachedTmdbSeries(spec.tmdbId),
    fetchTitleKeywords(tmdbMedia, spec.tmdbId),
  ]);
  return {
    genreIds: (details.genres ?? [])
      .map((genre) => genre.id)
      .filter((id): id is number => typeof id === "number"),
    language: details.original_language ?? null,
    keywordIds,
  };
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
  if (!isRowAllowed(spec, prefs))
    throw new AppError("Invalid discover row", 400);
  if (
    spec.kind === "because" &&
    !(await isDiscoverSeedCandidate(userId, spec.media, spec.tmdbId))
  ) {
    throw new AppError("Invalid discover row", 400);
  }

  const seed = spec.kind === "because" ? await loadSeedDetails(spec) : null;
  const data = await discoverTitlesPage(
    { ...buildRowParams(spec, prefs, seed), page },
    spec.kind === "trending"
      ? DISCOVER_TTL_SECONDS.trending
      : DISCOVER_TTL_SECONDS.discover,
  );

  const seen = new Set<string>();
  const items: DiscoverTitle[] = [];
  for (const result of data.results) {
    const title = toDiscoverTitle(result, spec.media);
    if (!title || seen.has(titleKey(title))) continue;
    if (spec.kind === "because" && title.tmdbId === spec.tmdbId) continue;
    seen.add(titleKey(title));
    items.push(title);
  }

  await attachWatchStatus(userId, items);
  return {
    items,
    page,
    hasMore: page < Math.min(data.totalPages, DISCOVER_MAX_PAGE),
  };
}
