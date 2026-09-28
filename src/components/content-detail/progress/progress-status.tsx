"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { SeasonSelect } from "@/components/content-detail/progress/season-select";
import { Tooltip } from "@/components/ui/tooltip";
import type { SeasonOption } from "@/hooks/title-details/use-progress-seasons";
import { useContentMutation } from "@/hooks/title-details/use-content-mutation";
import { usePopover } from "@/hooks/use-popover";
import { useProgressStatus } from "@/hooks/title-details/use-progress-status";
import type { SeriesDetails } from "@/lib/types";
import { NON_RELEASED_MEDIA_TOOLTIP, WATCH_STATUS } from "@/lib/constants";
import { isSeriesWatchable } from "@/lib/media/series-progress";
import {
  WATCH_STATUS_ICONS,
  WATCH_STATUS_INDICATOR,
  WATCH_STATUS_INDICATOR_TEXT,
} from "@/lib/media/watch-status";
import { cn } from "@/lib/utils";
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
  const { isOpen, containerRef, toggle, close } = usePopover(isDisabled);
  const isStatusMutating = isMutating && lastMutation === "update-watch-status";
  const currentStatusObj =
    WATCH_STATUS[status as keyof typeof WATCH_STATUS] ?? WATCH_STATUS[0];
  const currentIndicator = WATCH_STATUS_INDICATOR[status] ?? "accentAlt";
  const CurrentStatusIcon =
    WATCH_STATUS_ICONS[status as keyof typeof WATCH_STATUS_ICONS] ??
    WATCH_STATUS_ICONS[0];
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

  const statusButton = (
    <button
      className="inline-flex min-h-10 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-highest disabled:pointer-events-none disabled:opacity-50"
      disabled={isDisabled}
      onClick={toggle}
      type="button"
    >
      {isStatusMutating ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
      ) : (
        <CurrentStatusIcon
          className={cn(
            "h-4 w-4",
            WATCH_STATUS_INDICATOR_TEXT[currentIndicator],
          )}
        />
      )}
      <span className="font-medium">
        {isStatusMutating ? "Updating..." : currentStatusObj.display_value}
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-outline-muted transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );

  const statusTrigger = showUnreleasedTooltip ? (
    <Tooltip
      align="start"
      content={NON_RELEASED_MEDIA_TOOLTIP}
      contentClassName="whitespace-nowrap"
      side="top"
    >
      {statusButton}
    </Tooltip>
  ) : (
    statusButton
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative" ref={containerRef}>
        {statusTrigger}

        {isOpen ? (
          <div className="absolute top-full left-0 z-50 mt-2 w-full max-w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-outline-alt bg-surface-container shadow-[0_8px_24px_rgb(0_0_0/25%)]">
            <div className="flex flex-col py-1.5">
              {Object.values(WATCH_STATUS).map((ws) => {
                const isSelected = ws.value === status;
                const indicator = WATCH_STATUS_INDICATOR[ws.value];
                const Icon = WATCH_STATUS_ICONS[ws.value];
                return (
                  <button
                    className={cn(
                      "inline-flex items-center justify-between px-3.5 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-high",
                      isSelected && "bg-surface-container-high",
                    )}
                    disabled={isDisabled}
                    key={ws.value}
                    onClick={() => {
                      close();
                      if (ws.value === status) return;
                      requestMutation("update-watch-status", {
                        value: ws.value,
                        requireWatchlist: false,
                        requireWatchActivity: false,
                      });
                    }}
                    type="button"
                  >
                    <div className="inline-flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          WATCH_STATUS_INDICATOR_TEXT[indicator],
                        )}
                      />
                      <span className="font-medium">{ws.display_value}</span>
                    </div>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-brand-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

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
