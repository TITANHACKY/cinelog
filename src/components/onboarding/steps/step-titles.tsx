"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/http/client";
import { Badge } from "@/components/ui/badge";
import { MediaCard } from "@/components/ui/media-card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { TMDB_POSTER_BASE_URL } from "@/lib/constants";
import type { MediaLean, TitleCandidate } from "@/lib/types";

type SearchResult = {
  id: number;
  title: string;
  poster_path: string | null; // full URL from the search API
  release_date: string | null; // already a year string
  vote_average: number | null;
  is_present_in_watchlist?: boolean;
};

// mediaType -> add endpoint segment / detail route segment
const MEDIA_SEGMENT = { 0: "movie", 1: "series" } as const;

function candidateKey(candidate: Pick<TitleCandidate, "tmdbId" | "mediaType">) {
  return `${candidate.mediaType}-${candidate.tmdbId}`;
}

// The search API returns fully-qualified poster URLs, but MediaCard rebuilds the
// URL from a raw TMDB path — so strip the base back off to keep the two sources
// (search + discover) consistent.
function toRawPosterPath(fullUrl: string | null): string | null {
  if (!fullUrl) return null;
  return fullUrl.startsWith(TMDB_POSTER_BASE_URL)
    ? fullUrl.slice(TMDB_POSTER_BASE_URL.length)
    : fullUrl;
}

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
    posterPath: toRawPosterPath(r.poster_path),
    year: r.release_date ?? null,
    rating: r.vote_average ?? null,
    inWatchlist: r.is_present_in_watchlist ?? false,
  }));
}

export function StepTitles({
  genreIds,
  mediaLean,
  languages,
  minRating,
  eras,
}: {
  genreIds: number[];
  mediaLean: MediaLean;
  languages?: string[];
  minRating?: number | null;
  eras?: string[];
}) {
  const [suggestions, setSuggestions] = useState<TitleCandidate[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TitleCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Stable primitive keys so the effect only re-runs when the values change,
  // not on every parent re-render that hands us a fresh array reference.
  const genreKey = genreIds.join(",");
  const languageKey = (languages ?? []).join(",");
  const eraKey = (eras ?? []).join(",");

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ mediaType: String(mediaLean) });
    if (genreKey) params.set("genres", genreKey);
    if (languageKey) params.set("languages", languageKey);
    if (eraKey) params.set("eras", eraKey);
    if (minRating != null) params.set("minRating", String(minRating));
    apiFetch(`/api/onboarding/title-suggestions?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { titles: [] }))
      .then((json: { titles?: TitleCandidate[] }) => {
        if (!ignore) setSuggestions(json.titles ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoadingSuggestions(false);
      });
    return () => {
      ignore = true;
    };
  }, [genreKey, mediaLean, languageKey, eraKey, minRating]);

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
        const merged = [...movies, ...series];
        setResults(merged);
        // Pre-mark anything the search says is already on the watchlist.
        const preAdded = merged
          .filter((candidate) => candidate.inWatchlist)
          .map(candidateKey);
        if (preAdded.length > 0) {
          setAddedKeys((prev) => new Set([...prev, ...preAdded]));
        }
        setIsSearching(false);
      }
    }, 500);
    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery, mediaLean]);

  async function handleAdd(candidate: TitleCandidate) {
    const key = candidateKey(candidate);
    if (addedKeys.has(key) || pendingKeys.has(key)) return;

    setErrorKey(null);
    setPendingKeys((prev) => new Set(prev).add(key));
    try {
      const res = await apiFetch(
        `/api/${MEDIA_SEGMENT[candidate.mediaType]}/${candidate.tmdbId}`,
        { method: "POST" },
      );
      // 409 = already in the library, which is the same end state we want.
      if (res.ok || res.status === 409) {
        setAddedKeys((prev) => new Set(prev).add(key));
      } else {
        setErrorKey(key);
      }
    } catch {
      setErrorKey(key);
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  const addedCount = addedKeys.size;

  function renderGrid(items: TitleCandidate[]) {
    return (
      <div className="grid grid-cols-2 justify-items-stretch gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] sm:gap-4">
        {items.map((candidate) => {
          const key = candidateKey(candidate);
          const isAdded = addedKeys.has(key);
          const isPending = pendingKeys.has(key);
          const hasError = errorKey === key;
          return (
            <MediaCard
              key={key}
              href={`/${MEDIA_SEGMENT[candidate.mediaType]}/${candidate.tmdbId}`}
              title={candidate.title}
              posterPath={candidate.posterPath}
              year={candidate.year ?? ""}
              rating={candidate.rating != null ? candidate.rating.toFixed(1) : "–"}
              actionsPosition="below"
              actions={
                isAdded ? (
                  <Badge
                    className="w-full justify-center border-status-success/40"
                    indicator="success"
                    inlineStart={<Check />}
                    text="Added"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAdd(candidate)}
                    disabled={isPending}
                    aria-label={`Add ${candidate.title} to your watchlist`}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full border border-outline-alt bg-surface-container-low px-3 py-1 font-public-sans text-xs font-medium text-on-surface transition-colors hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>{hasError ? "Retry" : "Watchlist"}</span>
                  </button>
                )
              }
            />
          );
        })}
      </div>
    );
  }

  const helperText = useMemo(
    () =>
      addedCount > 0
        ? `${addedCount} added to your watchlist`
        : "Optional — add any you like to your watchlist.",
    [addedCount],
  );

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
      <p className="font-public-sans text-xs text-secondary">{helperText}</p>
    </div>
  );
}
