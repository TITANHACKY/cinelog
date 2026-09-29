export const DISCOVER_ROW_CAP = 10;
export const DISCOVER_MIN_ROW_ITEMS = 6;
export const DISCOVER_MAX_PAGE = 10;
export const DISCOVER_SEED_LIMIT = 2;
export const DISCOVER_NEW_RELEASE_DAYS = 90;

export const DISCOVER_QUOTAS = {
  because: 2,
  genre: 2,
  lang: 2,
} as const;

export const DISCOVER_TTL_SECONDS = {
  trending: 3 * 60 * 60,
  discover: 12 * 60 * 60,
  recommendations: 24 * 60 * 60,
  keywords: 24 * 60 * 60,
} as const;

export const DISCOVER_GEMS = {
  minRating: 7.5,
  minVotes: 100,
  maxVotes: 1000,
} as const;

export const DISCOVER_ERA_MIN_VOTES = 200;

// "Because you watched" matches ANY of the seed's first N keywords.
export const DISCOVER_SEED_KEYWORDS = 5;

// TMDB movie and TV genre ids differ. Keys are the ids native to one media
// type; the value is the equivalent id for the other type (null = none).
export const MOVIE_TO_TV_GENRE: Record<number, number | null> = {
  28: 10759,
  12: 10759,
  878: 10765,
  14: 10765,
  10752: 10768,
  16: 16,
  35: 35,
  80: 80,
  99: 99,
  18: 18,
  10751: 10751,
  9648: 9648,
  37: 37,
  27: null,
  53: null,
  10749: null,
  36: null,
  10402: null,
  10770: null,
};

export const TV_TO_MOVIE_GENRE: Record<number, number | null> = {
  10759: 28,
  10765: 878,
  10768: 10752,
  16: 16,
  35: 35,
  80: 80,
  99: 99,
  18: 18,
  10751: 10751,
  9648: 9648,
  37: 37,
  10762: null,
  10763: null,
  10764: null,
  10766: null,
  10767: null,
};

export const DISCOVER_ERA_TITLES: Record<string, string> = {
  "pre-1980": "Classics before 1980",
  "1980s": "Best of the 1980s",
  "1990s": "Best of the 1990s",
  "2000s": "Best of the 2000s",
  "2010s": "Best of the 2010s",
  "2020s": "Best of the 2020s",
};
