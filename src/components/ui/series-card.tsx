"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardRemoveButton } from "@/components/ui/card-remove-button";
import { CardStatusToggle } from "@/components/ui/card-status-toggle";
import { MediaCard } from "@/components/ui/media-card";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { useLibraryItemMutation } from "@/hooks/library/use-library-item-mutation";
import { useLocales } from "@/hooks/locales/use-locales";
import { NON_RELEASED_SERIES_TOOLTIP } from "@/lib/constants";
import { formatMediaMeta, getYearString } from "@/lib/media/display";
import {
  calculateSeriesProgress,
  isSeriesWatchable,
} from "@/lib/media/series-progress";
import { canUpdateSeriesWatchActivity } from "@/lib/media/status";
import type { LibrarySeries } from "@/lib/types";

export function SeriesCard({
  series,
  actionsPosition,
}: {
  series: LibrarySeries;
  actionsPosition?: "inline" | "below";
}) {
  const {
    isPending,
    isStatusPending,
    isProgressPending,
    isRemovePending,
    requestMutation,
    requestRemove,
  } = useLibraryItemMutation("series", series.tmdb_id);
  const watchStatus = series.watch_status ?? 0;
  const isWatching = watchStatus === 1;
  const resolvedActionsPosition = actionsPosition ?? "below";
  const seasonsInfo = series.seasons_info ?? [];
  const progress = calculateSeriesProgress(seasonsInfo);
  const nextEpisode = progress.nextEpisode;
  const totalSeasons = series.total_number_of_seasons ?? 0;
  const completedSeasons = series.total_number_of_seasons_watched ?? 0;
  const episodesWatched = series.total_number_of_episodes_watched ?? 0;
  const totalEpisodes = series.total_number_of_episodes ?? 0;
  const percentage =
    totalEpisodes > 0
      ? Math.min(100, Math.round((episodesWatched / totalEpisodes) * 100))
      : 0;

  const countableSeasons = seasonsInfo
    .filter((season) => season.season_number > 0 && season.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);

  const currentSeason =
    (nextEpisode
      ? countableSeasons.find(
          (season) => season.season_number === nextEpisode.seasonNumber,
        )
      : null) ??
    [...countableSeasons].reverse().find((season) => season.episodes_watched > 0) ??
    countableSeasons[countableSeasons.length - 1];

  const currentSeasonEpisodesWatched = currentSeason
    ? Math.min(
        Math.max(currentSeason.episodes_watched ?? 0, 0),
        currentSeason.episode_count ?? 0,
      )
    : episodesWatched;

  const currentSeasonTotalEpisodes =
    currentSeason?.episode_count ?? totalEpisodes;
  const canUpdateWatchActivity = canUpdateSeriesWatchActivity(series.status);
  const isWatchable = isSeriesWatchable(series.status, seasonsInfo);
  const { formatLanguage, formatCountry } = useLocales();
  const isNextDisabled =
    isPending || !canUpdateWatchActivity || nextEpisode === null;
  const nextEpisodeLabel = nextEpisode
    ? `Mark season ${nextEpisode.seasonNumber}, episode ${nextEpisode.episodeNumber} watched`
    : "All aired episodes watched";

  const removeButton = (
    <CardRemoveButton
      disabled={isPending}
      loading={isRemovePending}
      onClick={() => requestRemove({ title: series.name })}
    />
  );

  const statusToggle = (
    <CardStatusToggle
      disabled={
        isPending ||
        (watchStatus === 0 ? !isWatchable : !canUpdateWatchActivity)
      }
      expanded={resolvedActionsPosition === "below"}
      loading={isStatusPending}
      onSelect={(nextWatchStatus) =>
        requestMutation({ watch_status: nextWatchStatus, title: series.name })
      }
      watchStatus={watchStatus}
    />
  );

  const actions = isWatching ? (
    <>
      {removeButton}
      <Button
        aria-label={nextEpisodeLabel}
        className="h-8 flex-1 justify-center gap-1.5 rounded-[6px] border border-current/30 bg-current/10 px-2.5 text-xs font-semibold text-status-info transition-colors hover:bg-current/20"
        disabled={isNextDisabled}
        onClick={() => {
          if (isNextDisabled || !nextEpisode) return;
          requestMutation({ progress: nextEpisode, title: series.name });
        }}
        title={nextEpisodeLabel}
        type="button"
        variant="ghost"
      >
        {isProgressPending ? (
          <Loader2 className="size-3.5 animate-spin text-current" />
        ) : (
          <Check className="size-3.5" />
        )}
        {nextEpisode ? (
          <span className="truncate">{`Ep ${nextEpisode.episodeNumber}`}</span>
        ) : null}
      </Button>
    </>
  ) : (
    <>
      {removeButton}
      {watchStatus === 0 && !isWatchable ? (
        <Tooltip
          align="end"
          className={
            resolvedActionsPosition === "below" ? "flex-1 min-w-0" : undefined
          }
          content={NON_RELEASED_SERIES_TOOLTIP}
          contentClassName="whitespace-nowrap"
          triggerClassName={
            resolvedActionsPosition === "below" ? "w-full" : undefined
          }
        >
          {statusToggle}
        </Tooltip>
      ) : (
        statusToggle
      )}
    </>
  );

  return (
    <MediaCard
      actions={actions}
      actionsPosition={resolvedActionsPosition}
      overlay={
        totalSeasons > 0 || totalEpisodes > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pt-8 pb-2 sm:px-3.5 sm:pb-2.5">
            <div className="flex w-full flex-col gap-1.5">
              <div className="flex items-center justify-between font-public-sans text-[10px] font-semibold tracking-[0.35px] text-white/90 uppercase drop-shadow-xs">
                <span>
                  {completedSeasons}/{totalSeasons} seasons
                </span>
                <span>
                  {currentSeasonEpisodesWatched}/{currentSeasonTotalEpisodes}{" "}
                  episodes
                </span>
              </div>
              <Progress
                className="h-1.5 rounded-[12px] bg-white/25"
                value={percentage}
              />
            </div>
          </div>
        ) : undefined
      }
      href={`/series/${series.tmdb_id}`}
      meta={formatMediaMeta(
        formatLanguage(series.original_language),
        formatCountry(series.origin_country),
      )}
      posterPath={series.poster_path}
      rating={(series.vote_average ?? 0).toFixed(1)}
      title={series.name}
      year={getYearString(series.first_air_date ?? undefined)}
    />
  );
}
