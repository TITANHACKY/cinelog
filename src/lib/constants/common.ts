import { Check, Clock, Heart, Play, ThumbsDown, ThumbsUp, X } from "lucide-react";

import type { BadgeIndicator } from "@/lib/types/ui";

export const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w200";

export const LIBRARY_PAGE_SIZE = 20;
export const SEARCH_YEAR_MIN = 1900;

export const WATCH_STATUS = {
  0: { value: 0, display_value: "Plan to Watch" },
  1: { value: 1, display_value: "Watching" },
  2: { value: 2, display_value: "Completed" },
  3: { value: 3, display_value: "Dropped" },
} as const;

export const IMPRESSION = {
  0: { value: 0, display_value: "Dislike" },
  1: { value: 1, display_value: "Like" },
  2: { value: 2, display_value: "Love" },
} as const;

export const MOVIE_STATUS = {
  rumored: { value: "rumored", display_value: "Rumored" },
  planned: { value: "planned", display_value: "Planned" },
  in_production: { value: "in_production", display_value: "In Production" },
  post_production: {
    value: "post_production",
    display_value: "Post Production",
  },
  released: { value: "released", display_value: "Released" },
  canceled: { value: "canceled", display_value: "Canceled" },
} as const;

export const SERIES_STATUS = {
  returning_series: {
    value: "returning_series",
    display_value: "Returning Series",
  },
  planned: { value: "planned", display_value: "Planned" },
  in_production: { value: "in_production", display_value: "In Production" },
  ended: { value: "ended", display_value: "Ended" },
  canceled: { value: "canceled", display_value: "Canceled" },
  pilot: { value: "pilot", display_value: "Pilot" },
} as const;

export type MovieStatusValue =
  (typeof MOVIE_STATUS)[keyof typeof MOVIE_STATUS]["value"];
export type SeriesStatusValue =
  (typeof SERIES_STATUS)[keyof typeof SERIES_STATUS]["value"];

export const WATCHABLE_MOVIE_STATUSES: ReadonlySet<MovieStatusValue> = new Set([
  MOVIE_STATUS.released.value,
]);

export const WATCHABLE_SERIES_STATUSES: ReadonlySet<SeriesStatusValue> =
  new Set([
    SERIES_STATUS.returning_series.value,
    SERIES_STATUS.ended.value,
    SERIES_STATUS.canceled.value,
    SERIES_STATUS.pilot.value,
  ]);

export const WATCH_STATUS_INDICATOR: Record<number, BadgeIndicator> = {
  0: "accentAlt",
  1: "info",
  2: "success",
  3: "error",
};

export const WATCH_STATUS_ICONS = {
  0: Clock,
  1: Play,
  2: Check,
  3: X,
} as const;

export const WATCH_STATUS_INDICATOR_TEXT: Record<BadgeIndicator, string> = {
  success: "text-status-success",
  info: "text-status-info",
  error: "text-status-error",
  accentAlt: "text-brand-tertiary-accent-alt",
};

export const IMPRESSION_CONFIG = {
  0: { icon: ThumbsDown, className: "text-outline-muted" },
  1: { icon: ThumbsUp, className: "text-status-info" },
  2: { icon: Heart, className: "text-status-error" },
} as const;

export const OPERATOR_SYMBOLS: Record<number, string> = {
  0: "=",
  1: "!=",
  2: ">",
  3: "<",
  4: "in"
};

export const FIELD_LABELS: Record<string, string> = {
  release_year: "Year",
  certification: "Cert",
  genre: "Genre",
  original_language: "Language",
  origin_country: "Origin",
};
