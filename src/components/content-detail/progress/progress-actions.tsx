"use client";

import { useMemo } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { SeasonOption } from "@/hooks/title-details/use-progress-seasons";
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
  episodesAired?: number;
  episodesWatched?: number;
  id?: number;
  mutationStatus?: ContentMutationStatus;
  lastMutation?: ContentMutation;
  pendingProgress?: ContentProgressMutation;
  seasonNumber?: number;
  seasons?: SeasonOption[];
  onSeasonChange?: (seasonNumber: number) => void;
};

const primaryActionClassName =
  "min-h-11 h-12 w-full shrink justify-center gap-2 rounded-xl px-3 text-sm font-semibold sm:h-14 sm:flex-1 sm:px-4 sm:text-base [&_span]:truncate";

const secondaryActionClassName =
  "min-h-11 h-12 w-full min-w-0 shrink justify-center gap-2 rounded-xl px-2 text-sm font-semibold sm:h-14 sm:flex-1 sm:px-3 sm:text-base [&_span]:truncate";

const stepperButtonClassName =
  "min-h-11 min-w-11 shrink-0 rounded-xl px-0 sm:min-h-12 sm:min-w-12";

function getNextAiredSeason(
  seasons: SeasonOption[],
  currentSeason: number,
): number | undefined {
  const sorted = [...seasons].sort(
    (left, right) => left.seasonNumber - right.seasonNumber,
  );
  const currentIndex = sorted.findIndex(
    (season) => season.seasonNumber === currentSeason,
  );

  for (let index = currentIndex + 1; index < sorted.length; index += 1) {
    const season = sorted[index];
    if (season.hasAired && season.episodesAired > 0) {
      return season.seasonNumber;
    }
  }

  return undefined;
}

function getPrimaryMarkLabel(nextEpisode: number, isComplete: boolean): string {
  if (isComplete) return "Season complete";
  if (nextEpisode <= 1) return "Mark episode 1 watched";
  return `Mark episode ${nextEpisode} watched`;
}

export function ProgressActions({
  disabled = false,
  isWatchable,
  episodeCount = 0,
  episodesAired = 0,
  episodesWatched = 0,
  id,
  mutationStatus = "idle",
  lastMutation,
  pendingProgress,
  seasonNumber = 1,
  seasons = [],
  onSeasonChange,
}: ProgressActionsProps) {
  const { requestMutation, isMutating } = useContentMutation({
    id,
    mediaType: "series",
    mutationStatus,
  });
  const maxTrackableEpisodes =
    episodesAired > 0 ? Math.min(episodeCount, episodesAired) : episodeCount;
  const isComplete =
    maxTrackableEpisodes <= 0 || episodesWatched >= maxTrackableEpisodes;
  const isForwardDisabled =
    disabled || id === undefined || isMutating || isComplete;
  const isUndoDisabled =
    disabled || id === undefined || isMutating || episodesWatched <= 0;
  const nextEpisode = Math.min(episodesWatched + 1, maxTrackableEpisodes);
  const previousEpisode = Math.max(episodesWatched - 1, 0);
  const nextSeasonNumber = getNextAiredSeason(seasons, seasonNumber);

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
    pendingProgress?.episodeNumber === maxTrackableEpisodes;

  const liveStatus = useMemo(() => {
    if (maxTrackableEpisodes <= 0) {
      return "No episodes available to track yet.";
    }

    if (isComplete) {
      return `Season ${seasonNumber} complete. ${episodesWatched} of ${maxTrackableEpisodes} episodes watched.`;
    }

    if (episodesWatched <= 0) {
      return `${maxTrackableEpisodes} episode${maxTrackableEpisodes === 1 ? "" : "s"} available to watch.`;
    }

    return `${episodesWatched} of ${maxTrackableEpisodes} episodes watched. Next: episode ${nextEpisode}.`;
  }, [
    episodesWatched,
    isComplete,
    maxTrackableEpisodes,
    nextEpisode,
    seasonNumber,
  ]);

  function updateProgress(episodeNumber: number, isActionDisabled: boolean) {
    if (isActionDisabled) return;
    requestMutation("update-progress", {
      progress: { seasonNumber, episodeNumber },
      requireWatchlist: false,
      requireWatchActivity: false,
    });
  }

  const showUnreleasedTooltip = isWatchable === false;
  const primaryMarkLabel = getPrimaryMarkLabel(nextEpisode, isComplete);
  const undoLabel =
    episodesWatched > 0
      ? `Undo episode ${episodesWatched}`
      : "Undo last episode";

  const continueSeasonButton =
    isComplete && nextSeasonNumber !== undefined && onSeasonChange ? (
      <Button
        className={primaryActionClassName}
        onClick={() => onSeasonChange(nextSeasonNumber)}
        type="button"
        variant="accentFilled"
      >
        Continue to season {nextSeasonNumber}
      </Button>
    ) : null;

  const seasonCompleteButton = !isComplete ? (
    <Button
      className={secondaryActionClassName}
      disabled={isForwardDisabled}
      onClick={() => updateProgress(maxTrackableEpisodes, isForwardDisabled)}
      type="button"
      variant="progressSeason"
    >
      {isSeasonMutating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCheck className="h-4 w-4" />
      )}
      <span>
        {isSeasonMutating ? "Marking season..." : "Mark season complete"}
      </span>
    </Button>
  ) : null;

  const undoButton = (
    <Button
      aria-label={undoLabel}
      className={secondaryActionClassName}
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
      <span>{isUndoMutating ? "Undoing..." : undoLabel}</span>
    </Button>
  );

  const markEpisodeButton = (
    <Button
      className={primaryActionClassName}
      disabled={isForwardDisabled}
      onClick={() => updateProgress(nextEpisode, isForwardDisabled)}
      type="button"
      variant="accentFilled"
    >
      {isEpisodeMutating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      <span>{isEpisodeMutating ? "Updating..." : primaryMarkLabel}</span>
    </Button>
  );

  const progressActions = (
    <div className="space-y-3">
      <p aria-live="polite" className="sr-only" role="status">
        {liveStatus}
      </p>

      {/* Mobile: episode stepper */}
      <div className="space-y-3 sm:hidden">
        <div className="flex items-center justify-center gap-3">
          <Button
            aria-label={undoLabel}
            className={stepperButtonClassName}
            disabled={isUndoDisabled}
            onClick={() => updateProgress(previousEpisode, isUndoDisabled)}
            type="button"
            variant="progressUndo"
          >
            {isUndoMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
          </Button>

          <div className="min-w-28 text-center">
            <p className="text-2xl font-bold tabular-nums text-on-surface">
              {episodesWatched}
            </p>
            <p className="text-xs text-secondary">
              of {maxTrackableEpisodes} watched
            </p>
          </div>

          <Button
            aria-label={primaryMarkLabel}
            className={stepperButtonClassName}
            disabled={isForwardDisabled}
            onClick={() => updateProgress(nextEpisode, isForwardDisabled)}
            type="button"
            variant="accentFilled"
          >
            {isEpisodeMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isComplete ? (
          <p className="text-center text-sm font-medium text-secondary">
            Season {seasonNumber} complete
          </p>
        ) : null}

        {continueSeasonButton}
        {seasonCompleteButton}
      </div>

      {/* Tablet / desktop: primary + secondary actions */}
      <div className="hidden flex-col gap-3 sm:flex lg:flex-row">
        {isComplete ? (
          <>
            {undoButton}
            <div className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-high px-3 text-sm font-medium text-secondary sm:min-h-14">
              Season {seasonNumber} complete
            </div>
            {continueSeasonButton}
          </>
        ) : (
          <>
            {undoButton}
            {markEpisodeButton}
            {seasonCompleteButton}
          </>
        )}
      </div>
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
