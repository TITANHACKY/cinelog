"use client";

import { useMemo } from "react";
import { useGetLocalesQuery } from "@/store/api/reference-api";

function lookupName(map: Map<string, string>, code?: string | null) {
  const trimmed = code?.trim();
  if (!trimmed) return "";

  return (
    map.get(trimmed) ??
    map.get(trimmed.toLowerCase()) ??
    map.get(trimmed.toUpperCase()) ??
    trimmed
  );
}

export function useLocales() {
  const result = useGetLocalesQuery();

  return useMemo(() => {
    const languages = result.data?.languages ?? [];
    const countries = result.data?.countries ?? [];
    const languageByCode = new Map(
      languages.map((language) => [language.iso_639_1, language.english_name]),
    );
    const countryByCode = new Map(
      countries.map((country) => [country.iso_3166_1, country.english_name]),
    );

    return {
      languages,
      countries,
      loading: result.isLoading,
      formatLanguage: (code?: string | null) =>
        lookupName(languageByCode, code),
      formatCountry: (code?: string | null) => lookupName(countryByCode, code),
    };
  }, [result.data, result.isLoading]);
}
