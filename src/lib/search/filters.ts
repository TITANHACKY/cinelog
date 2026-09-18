import { SEARCH_YEAR_MIN, TMDB_LANGUAGES, TMDB_REGIONS } from "@/lib/constants";

export type { TmdbLanguage, TmdbRegion } from "@/lib/constants";

export { TMDB_LANGUAGES, TMDB_REGIONS };

export function getSearchYears(now = new Date()) {
  const currentYear = now.getFullYear();
  return Array.from(
    { length: currentYear - SEARCH_YEAR_MIN + 1 },
    (_, index) => currentYear - index,
  );
}

export function getTmdbLanguageOptions() {
  return TMDB_LANGUAGES.map((language) => ({
    value: language.iso_639_1,
    label: `${language.english_name} (${language.iso_639_1})`,
  }));
}

export function getTmdbRegionOptions() {
  return TMDB_REGIONS.map((region) => ({
    value: region.iso_3166_1,
    label: `${region.english_name} (${region.iso_3166_1})`,
  }));
}
