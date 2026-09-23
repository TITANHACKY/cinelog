import { SEARCH_YEAR_MIN } from "@/lib/constants";
import type { CountryOption, LanguageOption } from "@/lib/types";

export function getSearchYears(now = new Date()) {
  const currentYear = now.getFullYear();
  return Array.from(
    { length: currentYear - SEARCH_YEAR_MIN + 1 },
    (_, index) => currentYear - index,
  );
}

export function getLanguageOptions(languages: LanguageOption[]) {
  return languages.map((language) => ({
    value: language.iso_639_1,
    label: `${language.english_name} (${language.iso_639_1})`,
  }));
}

export function getCountryOptions(countries: CountryOption[]) {
  return countries.map((country) => ({
    value: country.iso_3166_1,
    label: `${country.english_name} (${country.iso_3166_1})`,
  }));
}
