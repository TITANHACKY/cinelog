import { hasAiredOnOrBeforeToday, todayIsoDate } from "@/lib/media/air-date";
import { canUpdateSeriesWatchActivity } from "@/lib/media/status";
import type { LibrarySeriesSeason } from "@/lib/types";

type NextEpisode = {
  seasonNumber: number;
  episodeNumber: number;
};

export type SeriesProgress = {
  completedSeasons: number;
  totalSeasons: number;
  episodesWatched: number;
  totalEpisodes: number;
  percentage: number;
  nextEpisode: NextEpisode | null;
};

export function calculateSeriesProgress(
  seasons: LibrarySeriesSeason[],
  today = todayIsoDate(),
): SeriesProgress {
  const countableSeasons = seasons
    .filter((season) => season.season_number > 0 && season.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);

  let completedSeasons = 0;
  let episodesWatched = 0;
  let totalEpisodes = 0;
  let nextEpisode: NextEpisode | null = null;

  for (const season of countableSeasons) {
    const watched = Math.min(
      Math.max(season.episodes_watched, 0),
      season.episode_count,
    );

    totalEpisodes += season.episode_count;
    episodesWatched += watched;

    if (watched === season.episode_count) {
      completedSeasons += 1;
    } else if (
      !nextEpisode &&
      hasAiredOnOrBeforeToday(season.air_date, today)
    ) {
      nextEpisode = {
        seasonNumber: season.season_number,
        episodeNumber: watched + 1,
      };
    }
  }

  return {
    completedSeasons,
    totalSeasons: countableSeasons.length,
    episodesWatched,
    totalEpisodes,
    percentage:
      totalEpisodes > 0
        ? Math.min(100, Math.round((episodesWatched / totalEpisodes) * 100))
        : 0,
    nextEpisode,
  };
}

export function hasAiredSeriesEpisodes(
  seasons: Array<{
    season_number?: number;
    episode_count?: number;
    air_date?: string | null;
  }>,
  today = todayIsoDate(),
): boolean {
  return seasons.some(
    (season) =>
      (season.season_number ?? 0) > 0 &&
      (season.episode_count ?? 0) > 0 &&
      hasAiredOnOrBeforeToday(season.air_date, today),
  );
}

export function isSeriesWatchable(
  status: string | null | undefined,
  seasons: Array<{
    season_number?: number;
    episode_count?: number;
    air_date?: string | null;
  }>,
): boolean {
  return (
    canUpdateSeriesWatchActivity(status) && hasAiredSeriesEpisodes(seasons)
  );
}
