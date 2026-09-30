"use client";

import { Bookmark, BookmarkOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/content-detail/hero-header/share-link-button";
import { ReactionButton } from "@/components/content-detail/hero-header/reaction-button";
import { ProgressStatus } from "@/components/content-detail/progress/progress-status";
import { useContentMutation } from "@/hooks/title-details/use-content-mutation";
import { IMPRESSION, IMPRESSION_CONFIG } from "@/lib/constants";
import { isMovieWatchable } from "@/lib/media/status";
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
  const isWatchable =
    type === "movie"
      ? isMovieWatchable(movieDetails?.status, movieDetails?.release_date)
      : undefined;

  return (
    <div className="mt-6 border-t border-outline-variant pt-4">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Button
          className="h-10 gap-2 rounded-full border border-outline-variant bg-surface-container px-3.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high! sm:px-4 sm:text-sm"
          disabled={isMutating}
          onClick={() =>
            requestMutation(
              isPresentInWatchlist ? "remove-watchlist" : "add-watchlist",
              isPresentInWatchlist
                ? { requireWatchActivity: false }
                : undefined,
            )
          }
          type="button"
          variant="darkFilled"
        >
          {isAddingWatchlist || isRemovingWatchlist ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
          ) : isPresentInWatchlist ? (
            <BookmarkOff className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {isAddingWatchlist
            ? "Adding..."
            : isRemovingWatchlist
              ? "Removing..."
              : isPresentInWatchlist
                ? "Remove from Library"
                : "Add to Library"}
        </Button>

        {type === "movie" && (
          <ProgressStatus
            disabled={!isPresentInWatchlist || !canUpdateWatchActivity}
            id={id}
            isWatchable={isWatchable}
            lastMutation={lastMutation}
            mutationStatus={mutationStatus}
            type="movie"
            watchStatus={watchStatus}
          />
        )}

        <div className="mx-1 hidden h-6 w-px bg-outline-variant sm:block" />

        <div className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-container-high p-1">
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
                className={isActive ? "text-brand-primary" : "text-on-surface"}
                disabled={
                  !isPresentInWatchlist || isMutating || !canUpdateWatchActivity
                }
                icon={config.icon}
                iconClassName={
                  isActive && config.className ? config.className : ""
                }
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
