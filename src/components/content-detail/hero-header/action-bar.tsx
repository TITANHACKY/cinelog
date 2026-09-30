"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/content-detail/hero-header/share-link-button";
import { ReactionButton } from "@/components/content-detail/hero-header/reaction-button";
import { ProgressStatus } from "@/components/content-detail/progress/progress-status";
import { useContentMutation } from "@/hooks/title-details/use-content-mutation";
import { IMPRESSION, IMPRESSION_CONFIG } from "@/lib/constants";
import { isSeriesWatchable } from "@/lib/media/series-progress";
import { isMovieWatchable } from "@/lib/media/status";
import { cn } from "@/lib/utils";
import type { MovieDetails, SeriesDetails } from "@/lib/types";
import type {
  ContentMutation,
  ContentMutationStatus,
} from "@/store/api/content-types";

type ActionBarProps = {
  id?: number;
  imdbId?: string | null;
  language?: string | null;
  type?: "movie" | "series";
  isPresentInWatchlist?: boolean;
  impression?: number | null;
  watchStatus?: number | null;
  mutationStatus?: ContentMutationStatus;
  lastMutation?: ContentMutation;
  pendingValue?: number | null;
  content?: MovieDetails | SeriesDetails;
};

export function ActionBar({
  id,
  type,
  isPresentInWatchlist = false,
  impression = null,
  watchStatus = null,
  mutationStatus = "idle",
  lastMutation,
  pendingValue,
  content,
}: ActionBarProps) {
  const { requestMutation, isMutating, canUpdateWatchActivity } =
    useContentMutation({
      id,
      mediaType: type,
      mutationStatus,
      isPresentInWatchlist,
      content,
    });
  const isAddingWatchlist = isMutating && lastMutation === "add-watchlist";
  const isRemovingWatchlist = isMutating && lastMutation === "remove-watchlist";
  const movieDetails =
    type === "movie" ? (content as MovieDetails | undefined) : undefined;
  const seriesDetails =
    type === "series" ? (content as SeriesDetails | undefined) : undefined;
  const isWatchable =
    type === "movie"
      ? isMovieWatchable(movieDetails?.status, movieDetails?.release_date)
      : type === "series"
        ? isSeriesWatchable(seriesDetails?.status, seriesDetails?.seasons ?? [])
        : undefined;

  const [libraryAnimKey, setLibraryAnimKey] = useState(0);
  const [isLibraryAnimating, setIsLibraryAnimating] = useState(false);
  const [libraryAnimType, setLibraryAnimType] = useState<"add" | "remove">(
    "add",
  );
  const prevWatchlistRef = useRef<boolean | undefined>(isPresentInWatchlist);

  useEffect(() => {
    if (
      prevWatchlistRef.current !== undefined &&
      prevWatchlistRef.current !== isPresentInWatchlist
    ) {
      setLibraryAnimType(isPresentInWatchlist ? "add" : "remove");
      setLibraryAnimKey((k) => k + 1);
      setIsLibraryAnimating(true);
    }
    prevWatchlistRef.current = isPresentInWatchlist;
  }, [isPresentInWatchlist]);

  useEffect(() => {
    if (!isLibraryAnimating) return;
    const timer = setTimeout(() => {
      setIsLibraryAnimating(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isLibraryAnimating, libraryAnimKey]);

  const handleLibraryClick = () => {
    if (!isMutating) {
      setLibraryAnimType(isPresentInWatchlist ? "remove" : "add");
      setLibraryAnimKey((k) => k + 1);
      setIsLibraryAnimating(true);
      requestMutation(
        isPresentInWatchlist ? "remove-watchlist" : "add-watchlist",
        isPresentInWatchlist ? { requireWatchActivity: false } : undefined,
      );
    }
  };

  return (
    <div className="mt-6 border-t border-outline-variant pt-4">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Button
          className={cn(
            "relative h-10 gap-2 overflow-visible rounded-full border border-outline-variant bg-surface-container px-3.5 text-xs font-semibold text-on-surface transition-all duration-200 hover:bg-surface-container-high! active:scale-95 sm:px-4 sm:text-sm",
            isLibraryAnimating && "anim-reaction-squash",
            isPresentInWatchlist &&
              "border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15!",
          )}
          disabled={isMutating}
          onClick={handleLibraryClick}
          type="button"
          variant="darkFilled"
        >
          {/* Live Floating Reaction Sparks for Library Action */}
          {isLibraryAnimating && (
            <span
              key={`actionbar-sparks-${libraryAnimType}-${libraryAnimKey}`}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center select-none"
            >
              {libraryAnimType === "remove" ? (
                <span className="anim-reaction-drift-down text-neutral opacity-90 drop-shadow-sm">
                  <BookmarkOff className="size-4 fill-neutral" />
                </span>
              ) : (
                <>
                  <span className="anim-reaction-float-1 absolute text-brand-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]">
                    <Bookmark className="size-4 fill-brand-primary" />
                  </span>
                  <span className="anim-reaction-float-2 absolute text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]">
                    <Bookmark className="size-5 fill-blue-400" />
                  </span>
                  <span className="anim-reaction-float-3 absolute text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.8)]">
                    <Bookmark className="size-3.5 fill-sky-300" />
                  </span>
                </>
              )}
            </span>
          )}

          {isAddingWatchlist || isRemovingWatchlist ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
          ) : isPresentInWatchlist ? (
            <BookmarkOff className="h-4 w-4 transition-transform duration-200 scale-105" />
          ) : (
            <Bookmark className="h-4 w-4 transition-transform duration-200" />
          )}
          {isAddingWatchlist
            ? "Adding..."
            : isRemovingWatchlist
              ? "Removing..."
              : isPresentInWatchlist
                ? "Remove from Library"
                : "Add to Library"}
        </Button>

        {(type === "movie" || type === "series") && (
          <ProgressStatus
            disabled={!isPresentInWatchlist || !canUpdateWatchActivity}
            id={id}
            isWatchable={isWatchable}
            lastMutation={lastMutation}
            mutationStatus={mutationStatus}
            type={type}
            watchStatus={watchStatus}
          />
        )}

        <div className="mx-1 hidden h-6 w-px bg-outline-variant sm:block" />

        <div className="relative inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-container-high p-1">
          {Object.values(IMPRESSION).map((imp) => {
            const config =
              IMPRESSION_CONFIG[imp.value as keyof typeof IMPRESSION_CONFIG];
            const isActive = impression === imp.value;
            const isThisImpressionMutating =
              isMutating &&
              lastMutation === "update-impression" &&
              (pendingValue === imp.value ||
                (pendingValue === null && isActive));

            return (
              <ReactionButton
                active={isActive}
                disabled={
                  !isPresentInWatchlist || isMutating || !canUpdateWatchActivity
                }
                icon={config.icon}
                key={imp.value}
                label={imp.display_value}
                loading={isThisImpressionMutating}
                onClick={() =>
                  requestMutation("update-impression", {
                    value: isActive ? null : imp.value,
                  })
                }
              />
            );
          })}
        </div>
        <ShareLinkButton />
      </div>
    </div>
  );
}

export default ActionBar;
