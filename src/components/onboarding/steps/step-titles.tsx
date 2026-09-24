"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/http/client";
import { MediaCard } from "@/components/ui/media-card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { TMDB_POSTER_BASE_URL, TRIGGER_CLASS } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
  addedKeys,
  onAdded,
}: {
  genreIds: number[];
  mediaLean: MediaLean;
  languages?: string[];
  minRating?: number | null;
  eras?: string[];
  // When the wizard drives the added set (to gate "Finish"), it passes these;
  // in Settings the step manages its own local set.
  addedKeys?: Set<string>;
  onAdded?: (key: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<TitleCandidate[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TitleCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localAdded, setLocalAdded] = useState<Set<string>>(new Set());
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const added = addedKeys ?? localAdded;

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
        if (ignore) return;
        const titles = json.titles ?? [];
        setSuggestions(titles);
        // Show titles already on the watchlist as added (check) on load.
        for (const candidate of titles) {
          if (candidate.inWatchlist) markAdded(candidateKey(candidate));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoadingSuggestions(false);
      });
    return () => {
      ignore = true;
    };
    // markAdded is stable enough here; re-run only when the filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreKey, mediaLean, languageKey, eraKey, minRating]);

  function markAdded(key: string) {
    setLocalAdded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    onAdded?.(key);
  }

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
        // Reflect anything the search says is already on the watchlist.
        for (const candidate of [...movies, ...series]) {
          if (candidate.inWatchlist) markAdded(candidateKey(candidate));
        }
        setIsSearching(false);
      }
    }, 500);
    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
    // markAdded is stable enough for this effect's purpose; keying on the query
    // and media lean matches the original debounce contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, mediaLean]);

  async function handleAdd(candidate: TitleCandidate) {
    const key = candidateKey(candidate);
    if (added.has(key) || pendingKeys.has(key)) return;

    setErrorKey(null);
    setPendingKeys((prev) => new Set(prev).add(key));
    try {
      const res = await apiFetch(
        `/api/${MEDIA_SEGMENT[candidate.mediaType]}/${candidate.tmdbId}`,
        { method: "POST" },
      );
      // 409 = already in the library, which is the same end state we want.
      if (res.ok || res.status === 409) {
        markAdded(key);
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

  function renderCardAction(candidate: TitleCandidate) {
    const key = candidateKey(candidate);
    const isAdded = added.has(key);
    const isPending = pendingKeys.has(key);
    const hasError = errorKey === key;

    if (isAdded) {
      return (
        <span
          className={cn(TRIGGER_CLASS, "text-status-success")}
          aria-label={`${candidate.title} is on your watchlist`}
          title="On your watchlist"
        >
          <Check className="h-4 w-4" />
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleAdd(candidate)}
        disabled={isPending}
        aria-label={`Add ${candidate.title} to your watchlist`}
        title={hasError ? "Retry adding to watchlist" : "Add to watchlist"}
        className={cn(
          TRIGGER_CLASS,
          hasError ? "text-status-error" : "text-brand-primary",
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    );
  }

  function renderGrid(items: TitleCandidate[]) {
    return (
      <div className="grid grid-cols-2 justify-items-stretch gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] sm:gap-4">
        {items.map((candidate) => (
          <MediaCard
            key={candidateKey(candidate)}
            href={`/${MEDIA_SEGMENT[candidate.mediaType]}/${candidate.tmdbId}`}
            title={candidate.title}
            posterPath={candidate.posterPath}
            year={candidate.year ?? ""}
            rating={candidate.rating != null ? candidate.rating.toFixed(1) : "–"}
            meta={candidate.title}
            actions={renderCardAction(candidate)}
          />
        ))}
      </div>
    );
  }

  const addedCount = added.size;
  const helperText = useMemo(
    () =>
      addedCount > 0
        ? `${addedCount} on your watchlist`
        : "Tap + to add titles to your watchlist.",
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
