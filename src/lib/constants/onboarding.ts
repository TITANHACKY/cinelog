export const GENRE_MAX = 10;
export const LANGUAGE_MAX = 6;
// Onboarding requires the user to seed their watchlist with at least this many
// titles before they can finish.
export const MIN_WATCHLIST_TITLES = 3;

export const MEDIA_LEAN_OPTIONS = [
  { value: 0, label: "Mostly movies", description: "Films are my thing" },
  { value: 1, label: "Mostly series", description: "I binge shows" },
  { value: 2, label: "A bit of both", description: "Movies and series" },
] as const;

// value is stable (stored); gteYear/lteYear are for the future discover engine.
export const ERA_BUCKETS = [
  { value: "pre-1980", label: "Classic (pre-1980)", gteYear: null, lteYear: 1979 },
  { value: "1980s", label: "1980s", gteYear: 1980, lteYear: 1989 },
  { value: "1990s", label: "1990s", gteYear: 1990, lteYear: 1999 },
  { value: "2000s", label: "2000s", gteYear: 2000, lteYear: 2009 },
  { value: "2010s", label: "2010s", gteYear: 2010, lteYear: 2019 },
  { value: "2020s", label: "2020s & newer", gteYear: 2020, lteYear: null },
] as const;

export const MIN_RATING_OPTIONS = [
  { value: null, label: "Any rating" },
  { value: 6, label: "6+" },
  { value: 7, label: "7+" },
  { value: 8, label: "8+" },
] as const;

// Common languages rendered as chips during onboarding, in display/priority
// order (global + Indian regional). The live locales table is preferred for the
// display name when it's populated; `label` is the reliable fallback so a chip
// never degrades to a bare ISO code.
export const COMMON_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "pt", label: "Portuguese" },
] as const;

export const COMMON_LANGUAGE_CODES = COMMON_LANGUAGES.map((lang) => lang.code);

export const ERA_VALUES = ERA_BUCKETS.map((era) => era.value);
export const LANGUAGE_CODES: string[] = [...COMMON_LANGUAGE_CODES];
export const MIN_RATING_VALUES = [6, 7, 8] as const;
