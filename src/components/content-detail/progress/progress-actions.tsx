"use client";

import { Check, CheckCheck, ChevronLeft, Loader2 } from "lucide-react";
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

const progressActionClassName =
  "h-12 w-full min-w-0 shrink justify-center gap-2 rounded-xl px-2 text-sm font-semibold sm:h-14 sm:flex-1 sm:px-3 sm:text-base [&_span]:truncate";

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
  const isForwardDisabled =
    disabled || id === undefined || isMutating || isComplete;
  const isUndoDisabled =
    disabled || id === undefined || isMutating || episodesWatched <= 0;
  const nextEpisode = Math.min(episodesWatched + 1, episodeCount);
  const previousEpisode = Math.max(episodesWatched - 1, 0);
  const isEpisodeMutating =
    isMutating &&
    lastMutation === "update-progress" &&
    pendingProgress?.episodeNumber === nextEpisode;
  const isUndoMutating =
    isMutating &&
    lastMutation === "update-progress" &&
    pendingProgress?.episodeNumber === previousEpisode;
  const isSeasonMutating =
    isMutating &&
    lastMutation === "update-progress" &&
    pendingProgress?.episodeNumber === episodeCount;

  function updateProgress(episodeNumber: number, isActionDisabled: boolean) {
    if (isActionDisabled) return;
    requestMutation("update-progress", {
      progress: { seasonNumber, episodeNumber },
      requireWatchlist: false,
      requireWatchActivity: false,
    });
  }

  const showUnreleasedTooltip = isWatchable === false;
  const undoLabel = `Unmark Ep ${episodesWatched}`;

  const progressActions = (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        aria-label={undoLabel}
        className={progressActionClassName}
        disabled={isUndoDisabled}
        onClick={() => updateProgress(previousEpisode, isUndoDisabled)}
        type="button"
        variant="progressUndo"
      >
        {isUndoMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        <span>
          {isUndoMutating ? `Unmarking Ep ${episodesWatched}...` : undoLabel}
        </span>
      </Button>

      <Button
        className={progressActionClassName}
        disabled={isForwardDisabled}
        onClick={() => updateProgress(nextEpisode, isForwardDisabled)}
        type="button"
        variant="progressEpisode"
      >
        {isEpisodeMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        <span>
          {isEpisodeMutating
            ? "Updating Episode..."
            : `Mark Ep ${nextEpisode || 1} Watched`}
        </span>
      </Button>

      <Button
        className={progressActionClassName}
        disabled={isForwardDisabled}
        onClick={() => updateProgress(episodeCount, isForwardDisabled)}
        type="button"
        variant="progressSeason"
      >
        {isSeasonMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCheck className="h-4 w-4" />
        )}
        <span>
          {isSeasonMutating
            ? "Marking Season Watched..."
            : `Mark Season ${seasonNumber} Watched`}
        </span>
      </Button>
    </div>
  );

  if (showUnreleasedTooltip) {
    return (
      <Tooltip
        className="w-full"
        content={NON_RELEASED_SERIES_TOOLTIP}
        contentClassName="whitespace-nowrap"
        side="top"
        triggerClassName="w-full"
      >
        {progressActions}
      </Tooltip>
    );
  }

  return progressActions;
}

export default ProgressActions;
