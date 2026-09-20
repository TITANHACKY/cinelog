"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import { GENRE_MAX } from "@/lib/constants";
import { SelectableChip } from "@/components/onboarding/selectable-chip";

type GenreOption = { tmdb_id: number; name: string };

export function StepGenres({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (genreId: number) => void;
}) {
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    apiFetch("/api/genres")
      .then((res) => (res.ok ? res.json() : { genres: [] }))
      .then((json) => {
        if (!ignore) setGenres(json.genres ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const atMax = selected.length >= GENRE_MAX;

  if (isLoading) {
    return (
      <p className="font-public-sans text-sm text-secondary">Loading genres…</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => {
          const isSelected = selected.includes(genre.tmdb_id);
          return (
            <SelectableChip
              key={genre.tmdb_id}
              label={genre.name}
              selected={isSelected}
              disabled={!isSelected && atMax}
              onToggle={() => onToggle(genre.tmdb_id)}
            />
          );
        })}
      </div>
      <p className="font-public-sans text-xs text-secondary">
        Pick at least 1 (up to {GENRE_MAX}).
      </p>
    </div>
  );
}
