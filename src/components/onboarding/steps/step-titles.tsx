"use client";

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { MediaCard } from "@/components/ui/media-card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useTitleStep } from "@/hooks/onboarding/use-title-step";
import { TRIGGER_CLASS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MediaLean, TitleCandidate } from "@/lib/types";

const MEDIA_SEGMENT = { 0: "movie", 1: "series" } as const;
const MEDIA_LABEL = { 0: "Movie", 1: "Series" } as const;

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
  addedKeys?: Set<string>;
  onAdded?: (key: string) => void;
}) {
  const {
    query,
    setQuery,
    trimmedQuery,
    suggestions,
    isLoadingSuggestions,
    results,
    isSearching,
    added,
    pendingKeys,
    errorKey,
    handleAdd,
    candidateKey,
  } = useTitleStep({
    genreIds,
    mediaLean,
    languages,
    minRating,
    eras,
    addedKeys,
    onAdded,
  });

  function renderCardAction(candidate: TitleCandidate) {
    const key = candidateKey(candidate);
    const isAdded = added.has(key);
    const isPending = pendingKeys.has(key);
    const hasError = errorKey === key;

    if (isAdded) {
      return (
        <span
          className={cn(TRIGGER_CLASS, "text-status-success")}
          aria-label={`${candidate.title} is on your library`}
          title="On your library"
        >
          <BookmarkCheck className="h-4 w-4" />
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleAdd(candidate)}
        disabled={isPending}
        aria-label={`Add ${candidate.title} to your library`}
        title={hasError ? "Retry adding to library" : "Add to library"}
        className={cn(
          TRIGGER_CLASS,
          hasError ? "text-status-error" : "text-brand-primary",
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark className="h-4 w-4" />
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
            rating={
              candidate.rating != null ? candidate.rating.toFixed(1) : "–"
            }
            meta={MEDIA_LABEL[candidate.mediaType]}
            actions={renderCardAction(candidate)}
          />
        ))}
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

      <div className="relative flex min-h-60 flex-1 flex-col gap-2">
        {trimmedQuery.length > 0 ? (
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
        ) : isLoadingSuggestions ? (
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
    </div>
  );
}
