import {
  COMMON_LANGUAGES,
  DISCOVER_ERA_MIN_VOTES,
  DISCOVER_ERA_TITLES,
  DISCOVER_GEMS,
  DISCOVER_NEW_RELEASE_DAYS,
  DISCOVER_QUOTAS,
  DISCOVER_ROW_CAP,
  ERA_BUCKETS,
  ERA_VALUES,
  LANGUAGE_CODES,
  MOVIE_TO_TV_GENRE,
  TV_TO_MOVIE_GENRE,
} from "@/lib/constants";
import { eraWindow } from "@/lib/discover/era";
import type { DiscoverTitlesParams } from "@/lib/tmdb/discover";
import type { DiscoverMedia, UserPreferences } from "@/lib/types";

export type DiscoverRowSpec =
  | { kind: "trending"; media: DiscoverMedia | "all" }
  | { kind: "because"; media: DiscoverMedia; tmdbId: number }
  | { kind: "genre"; media: DiscoverMedia; genreId: number }
  | { kind: "new"; media: DiscoverMedia }
  | { kind: "lang"; media: DiscoverMedia; language: string }
  | { kind: "gems"; media: DiscoverMedia }
  | { kind: "era"; media: DiscoverMedia; era: string };

export type DiscoverSeed = {
  tmdbId: number;
  mediaType: DiscoverMedia;
  title: string;
};

export type PlannedRow = { key: string; spec: DiscoverRowSpec; title: string };

export type PlanPrefs = Pick<
  UserPreferences,
  "mediaLean" | "genreIds" | "languages" | "eras"
>;

export type RowPrefs = Pick<
  UserPreferences,
  "genreIds" | "languages" | "eras" | "minRating"
>;

export type TmdbRowRequest =
  | { source: "trending"; media: "movie" | "tv" | "all" }
  | { source: "recommendations"; media: "movie" | "tv"; tmdbId: number }
  | { source: "discover"; params: DiscoverTitlesParams };

function otherMedia(media: DiscoverMedia): DiscoverMedia {
  return media === "movie" ? "series" : "movie";
}

function tmdbMedia(media: DiscoverMedia): "movie" | "tv" {
  return media === "movie" ? "movie" : "tv";
}

// Resolve a stored genre id for the target media type. Ids native to the
// target pass through; ids native to the other type are mapped; null means
// the genre has no equivalent. Unknown ids pass through unchanged.
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

export function rowKey(spec: DiscoverRowSpec): string {
  switch (spec.kind) {
    case "trending":
    case "new":
    case "gems":
      return `${spec.kind}:${spec.media}`;
    case "because":
      return `because:${spec.media}:${spec.tmdbId}`;
    case "genre":
      return `genre:${spec.media}:${spec.genreId}`;
    case "lang":
      return `lang:${spec.media}:${spec.language}`;
    case "era":
      return `era:${spec.media}:${spec.era}`;
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

export function parseRowKey(key: string): DiscoverRowSpec | null {
  const parts = key.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const [kind, rawMedia, arg] = parts;
  const media = parseMedia(rawMedia);

  switch (kind) {
    case "trending":
      if (arg !== undefined) return null;
      if (rawMedia === "all") return { kind: "trending", media: "all" };
      return media ? { kind: "trending", media } : null;
    case "new":
      return media && arg === undefined ? { kind: "new", media } : null;
    case "gems":
      return media && arg === undefined ? { kind: "gems", media } : null;
    case "because": {
      const tmdbId = parsePositiveInt(arg);
      return media && tmdbId !== null
        ? { kind: "because", media, tmdbId }
        : null;
    }
    case "genre": {
      const genreId = parsePositiveInt(arg);
      return media && genreId !== null
        ? { kind: "genre", media, genreId }
        : null;
    }
    case "lang":
      return media && arg !== undefined && LANGUAGE_CODES.includes(arg)
        ? { kind: "lang", media, language: arg }
        : null;
    case "era":
      return media &&
        arg !== undefined &&
        (ERA_VALUES as readonly string[]).includes(arg)
        ? { kind: "era", media, era: arg }
        : null;
    default:
      return null;
  }
}

function languageLabel(code: string): string {
  return (
    COMMON_LANGUAGES.find((language) => language.code === code)?.label ??
    code.toUpperCase()
  );
}

export function buildDiscoverPlan(input: {
  prefs: PlanPrefs;
  seeds: DiscoverSeed[];
  genreNames: Map<number, string>;
}): PlannedRow[] {
  const { prefs, seeds, genreNames } = input;
  const rows: PlannedRow[] = [];
  const push = (spec: DiscoverRowSpec, title: string) => {
    const key = rowKey(spec);
    if (rows.some((row) => row.key === key)) return;
    rows.push({ key, spec, title });
  };

  // For "both", rows alternate movie/series in plan order, movie first.
  let alternation = 0;
  const nextMedia = (): DiscoverMedia => {
    if (prefs.mediaLean === 0) return "movie";
    if (prefs.mediaLean === 1) return "series";
    const media: DiscoverMedia = alternation % 2 === 0 ? "movie" : "series";
    alternation += 1;
    return media;
  };

  push(
    {
      kind: "trending",
      media:
        prefs.mediaLean === 0
          ? "movie"
          : prefs.mediaLean === 1
            ? "series"
            : "all",
    },
    "Trending this week",
  );

  for (const seed of seeds.slice(0, DISCOVER_QUOTAS.because)) {
    push(
      { kind: "because", media: seed.mediaType, tmdbId: seed.tmdbId },
      `Because you watched ${seed.title}`,
    );
  }

  for (const genreId of prefs.genreIds.slice(0, DISCOVER_QUOTAS.genre)) {
    const planned = nextMedia();
    // A genre with no equivalent for the planned type stays on the type
    // that has it (Thriller is movie-only on TMDB).
    const media =
      toMediaGenre(genreId, planned) !== null ? planned : otherMedia(planned);
    const name = genreNames.get(genreId);
    push(
      // Key on the media-native id so Action + Adventure (both TV 10759)
      // collapse into one row instead of two identical requests.
      {
        kind: "genre",
        media,
        genreId: toMediaGenre(genreId, media) ?? genreId,
      },
      name ? `Top picks in ${name}` : "Top picks for you",
    );
  }

  push({ kind: "new", media: nextMedia() }, "New in your genres");

  const nonEnglish = prefs.languages.filter((code) => code !== "en");
  for (const language of nonEnglish.slice(0, DISCOVER_QUOTAS.lang)) {
    push(
      { kind: "lang", media: nextMedia(), language },
      `Popular in ${languageLabel(language)}`,
    );
  }

  push({ kind: "gems", media: nextMedia() }, "Hidden gems for you");

  const era = prefs.eras[0];
  if (era && DISCOVER_ERA_TITLES[era]) {
    push({ kind: "era", media: nextMedia(), era }, DISCOVER_ERA_TITLES[era]);
  }

  return rows.slice(0, DISCOVER_ROW_CAP);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function genreFilter(genreIds: number[], media: DiscoverMedia): number[] {
  const mapped = genreIds
    .map((genreId) => toMediaGenre(genreId, media))
    .filter((genreId): genreId is number => genreId !== null);
  return [...new Set(mapped)];
}

export function rowRequest(
  spec: DiscoverRowSpec,
  prefs: RowPrefs,
  today: Date = new Date(),
): TmdbRowRequest {
  if (spec.kind === "trending") {
    return {
      source: "trending",
      media: spec.media === "all" ? "all" : tmdbMedia(spec.media),
    };
  }
  if (spec.kind === "because") {
    return {
      source: "recommendations",
      media: tmdbMedia(spec.media),
      tmdbId: spec.tmdbId,
    };
  }

  const type = tmdbMedia(spec.media);
  // TMDB discover accepts a single original language; lead with the first pick.
  const language = prefs.languages[0];
  const genres = genreFilter(prefs.genreIds, spec.media);

  switch (spec.kind) {
    case "genre": {
      const { gteYear, lteYear } = eraWindow(prefs.eras);
      return {
        source: "discover",
        params: {
          type,
          genreIds: [toMediaGenre(spec.genreId, spec.media) ?? spec.genreId],
          language,
          minRating: prefs.minRating,
          gteYear,
          lteYear,
        },
      };
    }
    case "new": {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - DISCOVER_NEW_RELEASE_DAYS);
      return {
        source: "discover",
        params: {
          type,
          genreIds: genres,
          language,
          gteDate: isoDate(from),
          lteDate: isoDate(today),
        },
      };
    }
    case "lang":
      return {
        source: "discover",
        params: {
          type,
          genreIds: genres,
          language: spec.language,
          minRating: prefs.minRating,
        },
      };
    case "gems":
      return {
        source: "discover",
        params: {
          type,
          genreIds: genres,
          language,
          minRating: DISCOVER_GEMS.minRating,
          minVoteCount: DISCOVER_GEMS.minVotes,
          maxVoteCount: DISCOVER_GEMS.maxVotes,
          sortBy: "vote_average.desc",
        },
      };
    case "era": {
      const bucket = ERA_BUCKETS.find((item) => item.value === spec.era);
      return {
        source: "discover",
        params: {
          type,
          genreIds: genres,
          language,
          gteYear: bucket?.gteYear ?? null,
          lteYear: bucket?.lteYear ?? null,
          minVoteCount: DISCOVER_ERA_MIN_VOTES,
          sortBy: "vote_average.desc",
        },
      };
    }
  }
}
