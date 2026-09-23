export const GENRE_MAX = 10;
export const LANGUAGE_MAX = 6;

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

// Common ISO-639-1 codes rendered as chips during onboarding. Only the "which
// languages are common" curation lives here — the human-readable names are
// resolved at render time from the locales table (see useLocales), so nothing
// language-specific is hardcoded. Order here is the display/priority order.
export const COMMON_LANGUAGE_CODES = [
  "en", // English
  "hi", // Hindi
  "ta", // Tamil
  "te", // Telugu
  "ml", // Malayalam
  "kn", // Kannada
  "bn", // Bengali
  "mr", // Marathi
  "es", // Spanish
  "fr", // French
  "de", // German
  "ja", // Japanese
  "ko", // Korean
  "zh", // Chinese
  "pt", // Portuguese
] as const;

export const ERA_VALUES = ERA_BUCKETS.map((era) => era.value);
export const LANGUAGE_CODES: string[] = [...COMMON_LANGUAGE_CODES];
export const MIN_RATING_VALUES = [6, 7, 8] as const;
