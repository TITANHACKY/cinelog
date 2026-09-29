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
};

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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {statusTrigger}

      {type === "series" ? (
        <div className="flex flex-wrap items-center gap-3">
          <SeasonSelect
            onSelect={(seasonNumber) => onSeasonChange?.(seasonNumber)}
            seasons={seasons}
            selectedSeason={selectedSeason}
          />
          <ProgressMetadata
            label="EPISODE"
            value={`${currentSeason?.episodesWatched ?? 0} of ${
              currentSeason?.episodeCount ?? episodeCount
            }`}
          />
        </div>
      ) : null}
    </div>
  );
}

function ProgressMetadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-secondary uppercase">
      <span className="text-outline-muted">{label}</span>
      <span className="text-on-surface">{value}</span>
    </div>
  );
}

export default ProgressStatus;
