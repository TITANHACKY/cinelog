"use client";

import { SeasonSelect } from "@/components/content-detail/progress/season-select";
import { CardStatusToggle } from "@/components/ui/card-status-toggle";
import { Tooltip } from "@/components/ui/tooltip";
import type { SeasonOption } from "@/hooks/title-details/use-progress-seasons";
import { useContentMutation } from "@/hooks/title-details/use-content-mutation";
import { useProgressStatus } from "@/hooks/title-details/use-progress-status";
import type { SeriesDetails } from "@/lib/types";
import { NON_RELEASED_MEDIA_TOOLTIP } from "@/lib/constants";
import { isSeriesWatchable } from "@/lib/media/series-progress";
import type {
  ContentMutation,
  ContentMutationStatus,
} from "@/store/api/content-types";

type ProgressStatusProps = {
  id?: number;
  series?: SeriesDetails | null;
  type?: "movie" | "series";
  watchStatus?: number | null;
  mutationStatus?: ContentMutationStatus;
  lastMutation?: ContentMutation;
  disabled?: boolean;
  isWatchable?: boolean;
  seasons?: SeasonOption[];
  selectedSeason?: number;
  onSeasonChange?: (seasonNumber: number) => void;
  showWatchStatus?: boolean;
  showSeasonControls?: boolean;
  size?: "default" | "lg";
};

export function getPositionSummary(
  watched: number,
  aired: number,
): string {
  if (aired <= 0) return "No episodes released yet";
  if (watched <= 0) {
    return `${aired} episode${aired === 1 ? "" : "s"} available`;
  }
  if (watched >= aired) {
    return `Ep ${watched} of ${aired} · Season complete`;
  }
  const remaining = aired - watched;
  return `Ep ${watched} of ${aired} · ${remaining} left`;
}

export function ProgressStatus({
  id,
  series,
  type = "series",
  watchStatus = 0,
  mutationStatus = "idle",
  lastMutation,
  disabled = false,
  isWatchable,
  seasons = [],
  selectedSeason,
  onSeasonChange,
  showWatchStatus = true,
  showSeasonControls = false,
  size = "lg",
}: ProgressStatusProps) {
  const { episodeCount } = useProgressStatus(series);
  const { requestMutation, isMutating } = useContentMutation({
    id,
    mediaType: type,
    mutationStatus,
  });
  const status = watchStatus ?? 0;
  const isDisabled = disabled || isMutating;
  const isStatusMutating = isMutating && lastMutation === "update-watch-status";
  const currentSeason = seasons.find(
    (season) => season.seasonNumber === selectedSeason,
  );
  const isSeries = type === "series";
  const resolvedIsWatchable =
    isWatchable !== undefined
      ? isWatchable
      : isSeries
        ? isSeriesWatchable(series?.status, series?.seasons ?? [])
        : true;
  const showUnreleasedTooltip = status === 0 && !resolvedIsWatchable;

  const statusToggle = (
    <CardStatusToggle
      className="w-full"
      disabled={isDisabled}
      expanded
      size={size}
      loading={isStatusMutating}
      onSelect={(nextWatchStatus) => {
        requestMutation("update-watch-status", {
          value: nextWatchStatus,
          requireWatchlist: false,
          requireWatchActivity: false,
        });
      }}
      watchStatus={status}
    />
  );

  const statusTrigger = (
    <div className="flex-none min-w-40 max-w-50">
      {showUnreleasedTooltip ? (
        <Tooltip
          align="start"
          content={NON_RELEASED_MEDIA_TOOLTIP}
          contentClassName="whitespace-nowrap"
          side="top"
          triggerClassName="w-full"
        >
          {statusToggle}
        </Tooltip>
      ) : (
        statusToggle
      )}
    </div>
  );

  const seasonEpisodeTotal = currentSeason?.episodeCount ?? episodeCount;
  const airedCount = currentSeason?.episodesAired ?? seasonEpisodeTotal;
  const watchedCount = currentSeason?.episodesWatched ?? 0;
  const positionSummary = getPositionSummary(watchedCount, airedCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {showWatchStatus ? statusTrigger : null}

      {type === "series" && showSeasonControls ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
          <SeasonSelect
            onSelect={(seasonNumber) => onSeasonChange?.(seasonNumber)}
            seasons={seasons}
            selectedSeason={selectedSeason}
          />
          <p
            aria-live="polite"
            className="min-w-0 text-sm font-medium text-on-surface sm:text-base"
          >
            {positionSummary}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default ProgressStatus;
