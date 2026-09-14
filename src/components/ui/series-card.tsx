"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardImpressionToggle } from "@/components/ui/card-impression-toggle";
import { MediaCard } from "@/components/ui/media-card";
import { Progress } from "@/components/ui/progress";
import { useLibraryItemMutation } from "@/hooks/library/use-library-item-mutation";
import { formatMediaMeta, getYearString } from "@/lib/media/display";
import { calculateSeriesProgress } from "@/lib/media/series-progress";
import { canUpdateSeriesWatchActivity } from "@/lib/media/status";
import type { LibrarySeries } from "@/lib/types";

export function SeriesCard({ series }: { series: LibrarySeries }) {
  const {
    isPending,
    isImpressionPending,
    isProgressPending,
    requestMutation,
  } = useLibraryItemMutation("series", series.tmdb_id);
  const progress = calculateSeriesProgress(series.seasons_info);
  const nextEpisode = progress.nextEpisode;
  const totalSeasons = series.total_number_of_seasons ?? 0;
  const completedSeasons = series.total_number_of_seasons_watched ?? 0;
  const episodesWatched = series.total_number_of_episodes_watched ?? 0;
  const totalEpisodes = series.total_number_of_episodes ?? 0;
  const percentage =
    totalEpisodes > 0
      ? Math.min(100, Math.round((episodesWatched / totalEpisodes) * 100))
      : 0;

  const countableSeasons = (series.seasons_info ?? [])
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
  const isNextDisabled =
    isPending || !canUpdateWatchActivity || nextEpisode === null;
  const nextEpisodeLabel = nextEpisode
    ? `Mark season ${nextEpisode.seasonNumber}, episode ${nextEpisode.episodeNumber} watched`
    : "All aired episodes watched";

  return (
    <MediaCard
      actions={
        <>
          <CardImpressionToggle
            disabled={isPending || !canUpdateWatchActivity}
            loading={isImpressionPending}
            impression={series.impression}
            onSelect={(impression) => requestMutation({ impression })}
          />
          <Button
            aria-label={nextEpisodeLabel}
            className="h-8 flex-1 justify-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold"
            disabled={isNextDisabled}
            onClick={() => {
              if (isNextDisabled || !nextEpisode) return;
              requestMutation({ progress: nextEpisode });
            }}
            title={nextEpisodeLabel}
            type="button"
            variant="primaryFilled"
          >
            {isProgressPending ? (
              <Loader2 className="size-3.5 animate-spin text-white" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span className="truncate">
              {nextEpisode ?
                `Ep ${nextEpisode.episodeNumber}` :
                !canUpdateWatchActivity ? null : `Completed`}
            </span>
          </Button>
        </>
      }
      actionsPosition="below"
      footerTop={
        <div className="flex w-full flex-col gap-1.5 pb-0.5">
          <div className="flex items-center justify-between font-public-sans text-[10px] font-semibold tracking-[0.35px] text-secondary uppercase">
            <span>
              {completedSeasons}/{totalSeasons} seasons
            </span>
            <span>
              {currentSeasonEpisodesWatched}/{currentSeasonTotalEpisodes} episodes
            </span>
          </div>
          <Progress
            className="h-1.5 rounded-[12px] bg-surface-container-high"
            value={percentage}
          />
        </div>
      }
      href={`/series/${series.tmdb_id}`}
      meta={formatMediaMeta(series.original_language, series.origin_country)}
      posterPath={series.poster_path}
      rating={(series.vote_average ?? 0).toFixed(1)}
      title={series.name}
      year={getYearString(series.first_air_date ?? undefined)}
    />
  );
}
