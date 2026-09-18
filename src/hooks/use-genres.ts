"use client";

import { useEffect, useState } from "react";

export type GenreOption = {
  tmdb_id: number;
  name: string;
};

let cachedGenres: GenreOption[] | null = null;
let genresPromise: Promise<GenreOption[]> | null = null;

async function fetchGenres(): Promise<GenreOption[]> {
  if (cachedGenres) {
    return cachedGenres;
  }

  if (!genresPromise) {
    genresPromise = fetch("/api/genres")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch genres");
        }
        const data = (await response.json()) as { genres?: GenreOption[] };
        cachedGenres = data.genres ?? [];
        return cachedGenres;
      })
      .finally(() => {
        genresPromise = null;
      });
  }

  return genresPromise;
}

export function useGenres() {
  const [genres, setGenres] = useState<GenreOption[]>(cachedGenres ?? []);
  const [loading, setLoading] = useState(!cachedGenres);

  useEffect(() => {
    let ignore = false;

    void fetchGenres()
      .then((items) => {
        if (!ignore) {
          setGenres(items);
        }
      })
      .catch(() => {
        if (!ignore) {
          setGenres([]);
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

  return { genres, loading };
}
