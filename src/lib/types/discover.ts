import type { MediaLean, TitleCandidate } from "./onboarding";

export type DiscoverMedia = "movie" | "series";

export type DiscoverTitle = TitleCandidate & {
  releaseDate: string | null;
  originalLanguage: string | null;
  // First origin country (ISO 3166-1); TMDB only sends it for series.
  originCountry: string | null;
  // null = not in the user's library
  watchStatus: number | null;
};

export type DiscoverRowPage = {
  items: DiscoverTitle[];
  page: number;
  hasMore: boolean;
};

// v2: the five fixed rows.
export type DiscoverRowId = "trending" | "new" | "because" | "top" | "lang";

export type DiscoverGenreOption = {
  // Stored preference id; movieId/seriesId are its per-media TMDB ids.
  id: number;
  name: string;
  movieId: number | null;
  seriesId: number | null;
};

export type DiscoverLanguageOption = { code: string; label: string };

export type DiscoverSeedInfo = {
  tmdbId: number;
  mediaType: DiscoverMedia;
  title: string;
};

export type DiscoverLayout =
  | { enabled: false }
  | {
      enabled: true;
      mediaLean: MediaLean;
      genres: DiscoverGenreOption[];
      languages: DiscoverLanguageOption[];
      seed: DiscoverSeedInfo | null;
    };

export type DiscoverLayoutReady = Extract<DiscoverLayout, { enabled: true }>;
