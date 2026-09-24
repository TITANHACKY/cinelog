import { ERA_BUCKETS } from "@/lib/constants";
import { getYearString } from "@/lib/media/display";
import { discoverTitles, type TmdbDiscoverResult } from "@/lib/tmdb/discover";
import { findWatchlistedTmdbIds } from "@/repositories/preferences";
import type { TitleCandidate } from "@/lib/types";

// Collapse the selected era buckets into one inclusive [gteYear, lteYear]
// window. TMDB's discover date filters can't express disjoint ranges, so we
// take the outer bounds of everything the user picked. A `null` bound means
// "open-ended" (pre-1980 has no lower bound, 2020s has no upper bound).
function eraWindow(eras: string[]): {
  gteYear: number | null;
  lteYear: number | null;
} {
  const buckets = ERA_BUCKETS.filter((bucket) =>
    eras.includes(bucket.value),
  );
  if (buckets.length === 0) return { gteYear: null, lteYear: null };

  let gteYear: number | null = Infinity;
  let lteYear: number | null = -Infinity;
  for (const bucket of buckets) {
    // A null lower/upper bound opens that side entirely.
    gteYear =
      bucket.gteYear === null || gteYear === null
        ? null
        : Math.min(gteYear, bucket.gteYear);
    lteYear =
      bucket.lteYear === null || lteYear === null
        ? null
        : Math.max(lteYear, bucket.lteYear);
  }
  return {
    gteYear: gteYear === Infinity ? null : gteYear,
    lteYear: lteYear === -Infinity ? null : lteYear,
  };
}

const PER_TYPE_LIMIT = 12;
const TOTAL_LIMIT = 24;
// TMDB's discover `with_original_language` takes a single value (no OR, unlike
// `with_genres`), so honoring several languages means one call per language.
// We bound the fan-out to the top few picks to keep the request count small.
const SUGGESTION_LANGUAGE_LIMIT = 3;

function toCandidate(result: TmdbDiscoverResult, mediaType: 0 | 1): TitleCandidate {
  return {
    tmdbId: result.id,
    mediaType,
    title: (result.title ?? result.name ?? "").trim(),
    // Raw TMDB path — the media-card builds the full poster URL.
    posterPath: result.poster_path,
    year: getYearString(result.release_date ?? result.first_air_date),
    rating: result.vote_average ?? null,
  };
}

// Round-robin merge: take one item from each list in turn, so every list is
// represented and the first list leads each round.
function interleave<T>(lists: T[][]): T[] {
  const merged: T[] = [];
  const max = lists.reduce((longest, list) => Math.max(longest, list.length), 0);
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (list[i]) merged.push(list[i]);
    }
  }
  return merged;
}

function dedupeByKey(candidates: TitleCandidate[]): TitleCandidate[] {
  const seen = new Set<string>();
  const unique: TitleCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.mediaType}-${candidate.tmdbId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }
  return unique;
}

export async function getTitleSuggestions(input: {
  genreIds: number[];
  mediaLean: 0 | 1 | 2;
  languages?: string[];
  minRating?: number | null;
  eras?: string[];
  userId?: number;
}): Promise<TitleCandidate[]> {
  const wantMovies = input.mediaLean === 0 || input.mediaLean === 2;
  const wantSeries = input.mediaLean === 1 || input.mediaLean === 2;

  const { gteYear, lteYear } = eraWindow(input.eras ?? []);
  const minRating = input.minRating ?? null;

  // Empty -> a single unfiltered pass (represented as one "no language" bucket).
  const languages = (input.languages ?? []).slice(0, SUGGESTION_LANGUAGE_LIMIT);
  const languageBuckets: Array<string | undefined> =
    languages.length > 0 ? languages : [undefined];

  // One bucket per language, each an interleaved movie/series list. All discover
  // calls (across languages and types) run in parallel.
  const buckets = await Promise.all(
    languageBuckets.map(async (language) => {
      // A single flaky discover call must not sink the whole suggestions
      // response — degrade it to an empty list so the other calls still render.
      const safeDiscover = (type: "movie" | "tv") =>
        discoverTitles({
          type,
          genreIds: input.genreIds,
          language,
          minRating,
          gteYear,
          lteYear,
        }).catch((): TmdbDiscoverResult[] => []);

      const [movies, series] = await Promise.all([
        wantMovies ? safeDiscover("movie") : Promise.resolve([]),
        wantSeries ? safeDiscover("tv") : Promise.resolve([]),
      ]);

      const movieCandidates = movies
        .slice(0, PER_TYPE_LIMIT)
        .map((r) => toCandidate(r, 0));
      const seriesCandidates = series
        .slice(0, PER_TYPE_LIMIT)
        .map((r) => toCandidate(r, 1));

      return interleave([movieCandidates, seriesCandidates]);
    }),
  );

  // Merge across languages (first-picked leads), drop dupes and empty titles,
  // then cap so the suggestions grid stays snappy.
  const candidates = dedupeByKey(interleave(buckets))
    .filter((candidate) => candidate.title.length > 0)
    .slice(0, TOTAL_LIMIT);

  // Flag any that are already on the user's watchlist so the UI shows them as
  // added (a check) instead of an add button.
  if (input.userId) {
    const movieTmdbIds = candidates
      .filter((c) => c.mediaType === 0)
      .map((c) => c.tmdbId);
    const seriesTmdbIds = candidates
      .filter((c) => c.mediaType === 1)
      .map((c) => c.tmdbId);
    const watchlisted = await findWatchlistedTmdbIds(
      input.userId,
      movieTmdbIds,
      seriesTmdbIds,
    );
    for (const candidate of candidates) {
      candidate.inWatchlist =
        candidate.mediaType === 0
          ? watchlisted.movies.has(candidate.tmdbId)
          : watchlisted.series.has(candidate.tmdbId);
    }
  }

  return candidates;
}
