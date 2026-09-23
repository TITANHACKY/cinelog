"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CountryOption, LanguageOption } from "@/lib/types";

type LocalesData = {
  languages: LanguageOption[];
  countries: CountryOption[];
};

type LocalesContextValue = LocalesData & {
  loading: boolean;
  formatLanguage: (code?: string | null) => string;
  formatCountry: (code?: string | null) => string;
};

let cachedLocales: LocalesData | null = null;
let localesPromise: Promise<LocalesData> | null = null;

const emptyLocales: LocalesData = {
  languages: [],
  countries: [],
};

async function fetchLocales(): Promise<LocalesData> {
  if (cachedLocales) {
    return cachedLocales;
  }

  if (!localesPromise) {
    localesPromise = fetch("/api/locales")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch locales");
        }
        const data = (await response.json()) as Partial<LocalesData>;
        cachedLocales = {
          languages: data.languages ?? [],
          countries: data.countries ?? [],
        };
        return cachedLocales;
      })
      .finally(() => {
        localesPromise = null;
      });
  }

  return localesPromise;
}

function lookupName(
  map: Map<string, string>,
  code?: string | null,
) {
  const trimmed = code?.trim();
  if (!trimmed) {
    return "";
  }

  return (
    map.get(trimmed) ??
    map.get(trimmed.toLowerCase()) ??
    map.get(trimmed.toUpperCase()) ??
    trimmed
  );
}

const LocalesContext = createContext<LocalesContextValue | null>(null);

export function LocalesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LocalesData>(cachedLocales ?? emptyLocales);
  const [loading, setLoading] = useState(!cachedLocales);

  useEffect(() => {
    let ignore = false;

    void fetchLocales()
      .then((next) => {
        if (!ignore) {
          setData(next);
        }
      })
      .catch(() => {
        if (!ignore) {
          setData(emptyLocales);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo<LocalesContextValue>(() => {
    const languageByCode = new Map(
      data.languages.map((language) => [
        language.iso_639_1,
        language.english_name,
      ]),
    );
    const countryByCode = new Map(
      data.countries.map((country) => [
        country.iso_3166_1,
        country.english_name,
      ]),
    );

    return {
      languages: data.languages,
      countries: data.countries,
      loading,
      formatLanguage: (code) => lookupName(languageByCode, code),
      formatCountry: (code) => lookupName(countryByCode, code),
    };
  }, [data, loading]);

  return (
    <LocalesContext.Provider value={value}>{children}</LocalesContext.Provider>
  );
}

const fallbackLocales: LocalesContextValue = {
  ...emptyLocales,
  loading: false,
  formatLanguage: (code) => code?.trim() ?? "",
  formatCountry: (code) => code?.trim() ?? "",
};

export function useLocales() {
  return useContext(LocalesContext) ?? fallbackLocales;
}
