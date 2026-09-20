"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/http/client";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { SEED_TITLE_MAX } from "@/lib/constants";
import type { MediaLean, SeedTitle, TitleCandidate } from "@/lib/types";

type SearchResult = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
};

async function searchType(
  query: string,
  type: "movie" | "series",
  mediaType: 0 | 1,
): Promise<TitleCandidate[]> {
  const res = await apiFetch(
    `/api/search/${type}?query=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: SearchResult[] };
  return (json.results ?? []).map((r) => ({
    tmdbId: r.id,
    mediaType,
    title: r.title,
    posterPath: r.poster_path,
    year: r.release_date ?? null,
  }));
}

export function StepTitles({
  genreIds,
  mediaLean,
  languages,
  seedTitles,
  onAdd,
  onRemove,
}: {
  genreIds: number[];
  mediaLean: MediaLean;
  languages?: string[];
  seedTitles: SeedTitle[];
  onAdd: (seed: SeedTitle) => void;
  onRemove: (tmdbId: number, mediaType: 0 | 1) => void;
}) {
  const [suggestions, setSuggestions] = useState<TitleCandidate[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TitleCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const atMax = seedTitles.length >= SEED_TITLE_MAX;

  // Stable primitive key so the effect only re-runs when the values change,
  // not on every parent re-render that hands us a fresh array reference.
  const genreKey = genreIds.join(",");
  const languageKey = (languages ?? []).join(",");

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ mediaType: String(mediaLean) });
    if (genreKey) params.set("genres", genreKey);
    if (languageKey) params.set("languages", languageKey);
    apiFetch(`/api/onboarding/title-suggestions?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { titles: [] }))
      .then((json) => {
        if (!ignore) setSuggestions(json.titles ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoadingSuggestions(false);
      });
    return () => {
      ignore = true;
    };
  }, [genreKey, mediaLean, languageKey]);

  // Search as the user types, debounced (project standard: 500ms, see
  // use-search-dialog). Empty query clears results back to suggestions.
  const trimmedQuery = query.trim();
  useEffect(() => {
    let ignore = false;
    const timeoutId = window.setTimeout(async () => {
      if (trimmedQuery.length === 0) {
        if (!ignore) {
          setResults([]);
          setIsSearching(false);
        }
        return;
      }
      if (!ignore) setIsSearching(true);
      const wantMovies = mediaLean === 0 || mediaLean === 2;
      const wantSeries = mediaLean === 1 || mediaLean === 2;
      const [movies, series] = await Promise.all([
        wantMovies ? searchType(trimmedQuery, "movie", 0) : Promise.resolve([]),
        wantSeries ? searchType(trimmedQuery, "series", 1) : Promise.resolve([]),
      ]);
      if (!ignore) {
        setResults([...movies, ...series]);
        setIsSearching(false);
      }
    }, 500);
    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery, mediaLean]);

  function isPicked(candidate: TitleCandidate) {
    return seedTitles.some(
      (s) => s.tmdbId === candidate.tmdbId && s.mediaType === candidate.mediaType,
    );
  }

  function renderGrid(items: TitleCandidate[]) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((candidate) => {
          const picked = isPicked(candidate);
          return (
            <button
              type="button"
              key={`${candidate.mediaType}-${candidate.tmdbId}`}
              aria-pressed={picked}
              disabled={!picked && atMax}
              onClick={() =>
                picked
                  ? onRemove(candidate.tmdbId, candidate.mediaType)
                  : onAdd({
                      tmdbId: candidate.tmdbId,
                      mediaType: candidate.mediaType,
                      title: candidate.title,
                      posterPath: candidate.posterPath,
                    })
              }
              className={`flex flex-col overflow-hidden rounded-lg border text-left transition-colors ${
                picked
                  ? "border-brand-primary"
                  : "border-outline-variant hover:border-outline-alt"
              } ${!picked && atMax ? "opacity-40" : ""}`}
            >
              {candidate.posterPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={candidate.posterPath}
                  alt={candidate.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[2/3] w-full bg-surface-container-high" />
              )}
              <span className="line-clamp-2 p-1.5 font-public-sans text-[11px] text-on-surface">
                {candidate.title}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a movie or series…"
          className="h-10 min-w-0 flex-1 rounded-lg border border-outline-alt bg-surface-container px-3 font-public-sans text-sm text-on-surface"
        />
      </div>

      {seedTitles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {seedTitles.map((seed) => (
            <span
              key={`${seed.mediaType}-${seed.tmdbId}`}
              className="inline-flex items-center gap-1 rounded-full border border-brand-primary bg-brand-primary-container/15 px-2.5 py-1 font-public-sans text-xs text-on-surface"
            >
              {seed.title}
              <button
                type="button"
                onClick={() => onRemove(seed.tmdbId, seed.mediaType)}
                aria-label={`Remove ${seed.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative flex min-h-[240px] flex-1 flex-col gap-2">
        {trimmedQuery.length > 0 ? (
          // Search mode
          isSearching ? (
            <LoadingOverlay
              message="Searching..."
              subMessage={`Looking for “${trimmedQuery}”`}
            />
          ) : results.length > 0 ? (
            renderGrid(results)
          ) : (
            <p className="font-public-sans text-sm text-secondary">
              No results for “{trimmedQuery}”.
            </p>
          )
        ) : // Suggestions mode
        isLoadingSuggestions ? (
          <LoadingOverlay
            message="Loading suggestions..."
            subMessage="Finding titles you might like"
          />
        ) : suggestions.length > 0 ? (
          <>
            <p className="font-public-sans text-xs text-secondary">
              Suggested for you
            </p>
            {renderGrid(suggestions)}
          </>
        ) : (
          <p className="font-public-sans text-sm text-secondary">
            No suggestions yet — try searching above.
          </p>
        )}
      </div>
      <p className="font-public-sans text-xs text-secondary">
        Optional — pick up to {SEED_TITLE_MAX}.
      </p>
    </div>
  );
}
