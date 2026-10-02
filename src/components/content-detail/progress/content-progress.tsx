"use client";

import { ProgressActions } from "@/components/content-detail/progress/progress-actions";
import { ProgressMetrics } from "@/components/content-detail/progress/progress-metrics";
import { ProgressStatus } from "@/components/content-detail/progress/progress-status";
import { useProgressSeasons } from "@/hooks/title-details/use-progress-seasons";
import { isSeriesWatchable } from "@/lib/media/series-progress";
import { canUpdateSeriesWatchActivity } from "@/lib/media/status";
import type { SeriesDetails } from "@/lib/types";
import { useContentMutationState } from "@/hooks/title-details/use-content-mutation-state";

type ContentProgressProps = {
  series?: SeriesDetails | null;
  type?: "movie" | "series";
};

export function ContentProgress({
  series,
  type = "series",
}: ContentProgressProps) {
  const mediaId = series?.id;
  const entry = useContentMutationState("series", mediaId);
  const { seasons, selectedSeason, setSelectedSeason } =
    useProgressSeasons(series);
  const selectedSeasonDetails = seasons.find(
    (season) => season.seasonNumber === selectedSeason,
  );
  const canUpdateWatchActivity = canUpdateSeriesWatchActivity(series?.status);
  const isWatchable = isSeriesWatchable(series?.status, series?.seasons ?? []);
  const isWatchActivityDisabled =
    !series?.is_present_in_watchlist || !canUpdateWatchActivity;

  return (
    <section className="m-2.5 sm:m-4 rounded-xl sm:rounded-[22px] border border-outline-variant bg-surface-container p-3.5 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      {type === "series" ? (
        <>
          <ProgressStatus
            id={mediaId}
            isWatchable={isWatchable}
            series={series}
            type={type}
            watchStatus={series?.watch_status}
            mutationStatus={entry?.mutationStatus}
            lastMutation={entry?.lastMutation}
            disabled={isWatchActivityDisabled}
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
            showWatchStatus={false}
            showSeasonControls
          />
          <div className="mt-5 h-px w-full bg-outline-variant" />
          <div className="mt-5">
            <ProgressMetrics series={series} selectedSeason={selectedSeason} />
          </div>
        </>
      ) : null}

      <div className={type === "series" ? "mt-6" : ""}>
        {type === "series" ? (
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-secondary uppercase">
            Track progress
          </h3>
        ) : null}
        <ProgressActions
          disabled={
            isWatchActivityDisabled ||
            !selectedSeasonDetails?.hasAired ||
            (selectedSeasonDetails?.episodesAired ?? 0) <= 0
          }
          episodeCount={selectedSeasonDetails?.episodeCount}
          episodesAired={selectedSeasonDetails?.episodesAired}
          episodesWatched={selectedSeasonDetails?.episodesWatched}
          id={mediaId}
          isWatchable={isWatchable && Boolean(selectedSeasonDetails?.hasAired)}
          lastMutation={entry?.lastMutation}
          mutationStatus={entry?.mutationStatus}
          onSeasonChange={setSelectedSeason}
          pendingProgress={entry?.pendingProgress}
          seasonNumber={selectedSeason}
          seasons={seasons}
        />
        {isWatchActivityDisabled && type === "series" ? (
          <p className="mt-3 text-center text-xs text-secondary sm:text-left">
            Add this series to your library to track episode progress.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default ContentProgress;
