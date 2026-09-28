"use client";

import { Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useContentMutation } from "@/hooks/title-details/use-content-mutation";
import { NON_RELEASED_SERIES_TOOLTIP } from "@/lib/constants";
import type {
  ContentMutation,
  ContentMutationStatus,
  ContentProgressMutation,
} from "@/store/api/content-types";

type ProgressActionsProps = {
  disabled?: boolean;
  isWatchable?: boolean;
  episodeCount?: number;
  episodesWatched?: number;
  id?: number;
  mutationStatus?: ContentMutationStatus;
  lastMutation?: ContentMutation;
  pendingProgress?: ContentProgressMutation;
  seasonNumber?: number;
};

export function ProgressActions({
  disabled = false,
  isWatchable,
  episodeCount = 0,
  episodesWatched = 0,
  id,
  mutationStatus = "idle",
  lastMutation,
  pendingProgress,
  seasonNumber = 1,
}: ProgressActionsProps) {
  const { requestMutation, isMutating } = useContentMutation({
    id,
    mediaType: "series",
    mutationStatus,
  });
  const isComplete = episodeCount <= 0 || episodesWatched >= episodeCount;
  const isDisabled = disabled || id === undefined || isMutating || isComplete;
  const nextEpisode = Math.min(episodesWatched + 1, episodeCount);
  const isEpisodeMutating =
    isMutating &&
    lastMutation === "update-progress" &&
    pendingProgress?.episodeNumber === nextEpisode;
  const isSeasonMutating =
    isMutating &&
    lastMutation === "update-progress" &&
    pendingProgress?.episodeNumber === episodeCount;

  function updateProgress(episodeNumber: number) {
    if (isDisabled) return;
    requestMutation("update-progress", {
      progress: { seasonNumber, episodeNumber },
      requireWatchlist: false,
      requireWatchActivity: false,
    });
  }

  const showUnreleasedTooltip = isWatchable === false;

  const episodeButton = (
    <Button
      className="h-12 w-full justify-center gap-2 rounded-xl border border-brand-primary-container bg-brand-primary-container px-4 text-sm font-semibold text-white hover:bg-brand-primary-container/90 sm:h-14 sm:text-base"
      disabled={isDisabled}
      onClick={() => updateProgress(nextEpisode)}
      type="button"
      variant="primaryFilled"
    >
      {isEpisodeMutating ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      {isEpisodeMutating
        ? "Updating Episode..."
        : `Mark Ep ${nextEpisode || 1} Watched`}
    </Button>
  );

  const seasonButton = (
    <Button
      className="h-12 w-full justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-highest sm:h-14 sm:text-base"
      disabled={isDisabled}
      onClick={() => updateProgress(episodeCount)}
      type="button"
      variant="darkFilled"
    >
      {isSeasonMutating ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-tertiary-accent-alt" />
      ) : (
        <CheckCheck className="h-4 w-4 text-brand-tertiary-accent-alt" />
      )}
      {isSeasonMutating
        ? "Marking Season Watched..."
        : `Mark Season ${seasonNumber} Watched`}
    </Button>
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {showUnreleasedTooltip ? (
        <Tooltip
          className="w-full"
          content={NON_RELEASED_SERIES_TOOLTIP}
          contentClassName="whitespace-nowrap"
          side="top"
          triggerClassName="w-full"
        >
          {episodeButton}
        </Tooltip>
      ) : (
        episodeButton
      )}

      {showUnreleasedTooltip ? (
        <Tooltip
          className="w-full"
          content={NON_RELEASED_SERIES_TOOLTIP}
          contentClassName="whitespace-nowrap"
          side="top"
          triggerClassName="w-full"
        >
          {seasonButton}
        </Tooltip>
      ) : (
        seasonButton
      )}
    </div>
  );
}

export default ProgressActions;
