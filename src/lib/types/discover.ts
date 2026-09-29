import type { TitleCandidate } from "./onboarding";

export type DiscoverMedia = "movie" | "series";

export type DiscoverRowKind =
  "trending" | "because" | "genre" | "new" | "lang" | "gems" | "era";

export type DiscoverTitle = TitleCandidate & {
  releaseDate: string | null;
  originalLanguage: string | null;
  // null = not in the user's library
  watchStatus: number | null;
};

export type DiscoverRow = {
  key: string;
  kind: DiscoverRowKind;
  title: string;
  mediaType: DiscoverMedia | "mixed";
  items: DiscoverTitle[];
  hasMore: boolean;
};

export type DiscoverResponse = { enabled: boolean; rows: DiscoverRow[] };

export type DiscoverRowPage = {
  items: DiscoverTitle[];
  page: number;
  hasMore: boolean;
};
