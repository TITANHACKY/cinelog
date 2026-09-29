import {
  DISCOVER_NEW_RELEASE_DAYS,
  DISCOVER_SEED_KEYWORDS,
  LANGUAGE_CODES,
  MOVIE_TO_TV_GENRE,
  TV_TO_MOVIE_GENRE,
} from "@/lib/constants";
import { eraWindow } from "@/lib/discover/era";
import type { DiscoverTitlesParams } from "@/lib/tmdb/discover";
import type { DiscoverMedia, UserPreferences } from "@/lib/types";

export type RowSpec =
  | { kind: "trending"; media: DiscoverMedia }
  | { kind: "new"; media: DiscoverMedia }
  | { kind: "because"; media: DiscoverMedia; tmdbId: number }
  | { kind: "top"; media: DiscoverMedia; genreId: number }
  | { kind: "lang"; media: DiscoverMedia; language: string };

export type RowPrefs = Pick<
  UserPreferences,
  "genreIds" | "languages" | "eras" | "minRating"
>;

// What the Because row needs from the seed's TMDB details.
export type SeedDetails = {
  genreIds: number[];
  language: string | null;
  keywordIds: number[];
};

function tmdbType(media: DiscoverMedia): "movie" | "tv" {
  return media === "movie" ? "movie" : "tv";
}

// Resolve a stored genre id for the target media type. Ids native to the
// target pass through; ids native to the other type are mapped; null means
// no equivalent. Unknown ids pass through unchanged.
export function toMediaGenre(
  genreId: number,
  media: DiscoverMedia,
): number | null {
  const native = media === "movie" ? MOVIE_TO_TV_GENRE : TV_TO_MOVIE_GENRE;
  const foreign = media === "movie" ? TV_TO_MOVIE_GENRE : MOVIE_TO_TV_GENRE;
  if (genreId in native) return genreId;
  if (genreId in foreign) return foreign[genreId];
  return genreId;
}

// The user's genres as TMDB ids for one media type: mapped, unmappable ones
// dropped, duplicates (Action + Adventure → TV 10759) collapsed, pick order kept.
export function genresForMedia(
  genreIds: number[],
  media: DiscoverMedia,
): number[] {
  const mapped = genreIds
    .map((genreId) => toMediaGenre(genreId, media))
    .filter((genreId): genreId is number => genreId !== null);
  return [...new Set(mapped)];
}

export function rowKey(spec: RowSpec): string {
  switch (spec.kind) {
    case "trending":
    case "new":
      return `${spec.kind}:${spec.media}`;
    case "because":
      return `because:${spec.media}:${spec.tmdbId}`;
    case "top":
      return `top:${spec.media}:${spec.genreId}`;
    case "lang":
      return `lang:${spec.media}:${spec.language}`;
  }
}

function parseMedia(value: string | undefined): DiscoverMedia | null {
  return value === "movie" || value === "series" ? value : null;
}

function parsePositiveInt(value: string | undefined): number | null {
  return value !== undefined && /^[1-9]\d{0,9}$/.test(value)
    ? Number(value)
    : null;
}

export function parseRowKey(key: string): RowSpec | null {
  const parts = key.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const [kind, rawMedia, arg] = parts;
  const media = parseMedia(rawMedia);
  if (!media) return null;

  switch (kind) {
    case "trending":
    case "new":
      return arg === undefined ? { kind, media } : null;
    case "because": {
      const tmdbId = parsePositiveInt(arg);
      return tmdbId === null ? null : { kind, media, tmdbId };
    }
    case "top": {
      const genreId = parsePositiveInt(arg);
      return genreId === null ? null : { kind, media, genreId };
    }
    case "lang":
      return arg !== undefined && LANGUAGE_CODES.includes(arg)
        ? { kind, media, language: arg }
        : null;
    default:
      return null;
  }
}

// Keys are built client-side from the user's own options; reject anything
// else so crafted keys can't fan out TMDB calls. Because-seed ownership is
// a database check done by the service.
export function isRowAllowed(spec: RowSpec, prefs: RowPrefs): boolean {
  if (spec.kind === "top") {
    return genresForMedia(prefs.genreIds, spec.media).includes(spec.genreId);
  }
  if (spec.kind === "lang") return prefs.languages.includes(spec.language);
  return true;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildRowParams(
  spec: RowSpec,
  prefs: RowPrefs,
  seed: SeedDetails | null,
  today: Date = new Date(),
): DiscoverTitlesParams {
  const type = tmdbType(spec.media);
  // Pipe = OR: one query for all of the user's languages.
  const languages = prefs.languages.join("|") || undefined;

  switch (spec.kind) {
    case "trending":
      return {
        type,
        genreIds: [],
        language: languages,
        sortBy: "popularity.desc",
      };
    case "new": {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - DISCOVER_NEW_RELEASE_DAYS);
      return {
        type,
        genreIds: [],
        language: languages,
        gteDate: isoDate(from),
        lteDate: isoDate(today),
        sortBy: "popularity.desc",
      };
    }
    case "because":
      if (!seed) throw new Error("Because rows need seed details");
      return {
        type,
        genreIds: seed.genreIds,
        language: seed.language ?? undefined,
        keywordIds: seed.keywordIds.slice(0, DISCOVER_SEED_KEYWORDS),
        sortBy: "popularity.desc",
      };
    case "top": {
      const { gteYear, lteYear } = eraWindow(prefs.eras);
      return {
        type,
        genreIds: [spec.genreId],
        language: languages,
        minRating: prefs.minRating,
        gteYear,
        lteYear,
        sortBy: "popularity.desc",
      };
    }
    case "lang": {
      const { gteYear, lteYear } = eraWindow(prefs.eras);
      return {
        type,
        genreIds: genresForMedia(prefs.genreIds, spec.media),
        language: spec.language,
        minRating: prefs.minRating,
        gteYear,
        lteYear,
        sortBy: "popularity.desc",
      };
    }
  }
}
