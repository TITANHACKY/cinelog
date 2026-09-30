import { hasAiredOnOrBeforeToday, todayIsoDate } from "@/lib/media/air-date";
import { canUpdateSeriesWatchActivity } from "@/lib/media/status";
import type { LibrarySeriesSeason, SeriesEpisodeToAir } from "@/lib/types";

type NextEpisode = {
  seasonNumber: number;
  episodeNumber: number;
};

type EpisodeAirContext = {
  lastEpisode?: SeriesEpisodeToAir | null;
  nextEpisode?: SeriesEpisodeToAir | null;
};

export function computeSeasonEpisodesAired(
  seasonNumber: number,
  episodeCount: number,
  { lastEpisode, nextEpisode }: EpisodeAirContext = {},
): number {
  if (seasonNumber <= 0 || episodeCount <= 0) {
    return 0;
  }

  const lastSeason = lastEpisode?.season_number;
  const lastEpisodeNumber = lastEpisode?.episode_number;

  if (lastSeason !== undefined && seasonNumber < lastSeason) {
    return episodeCount;
  }

  if (
    lastSeason !== undefined &&
    lastEpisodeNumber !== undefined &&
    seasonNumber === lastSeason
  ) {
    return Math.min(lastEpisodeNumber, episodeCount);
  }

  const nextSeason = nextEpisode?.season_number;
  const nextEpisodeNumber = nextEpisode?.episode_number;

  if (
    nextSeason !== undefined &&
    nextEpisodeNumber !== undefined &&
    seasonNumber === nextSeason &&
    nextEpisodeNumber > 1
  ) {
    return Math.min(nextEpisodeNumber - 1, episodeCount);
  }

  return 0;
}

export function computeTotalEpisodesAired(
  seasons: Array<{
    season_number?: number;
    episode_count?: number;
  }>,
  context: EpisodeAirContext = {},
): number {
  return seasons.reduce((total, season) => {
    const seasonNumber = season.season_number ?? 0;
    const episodeCount = season.episode_count ?? 0;
    return (
      total +
      computeSeasonEpisodesAired(seasonNumber, episodeCount, context)
    );
  }, 0);
}

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
    episodes_aired?: number;
    air_date?: string | null;
  }>,
  today = todayIsoDate(),
): boolean {
  return seasons.some((season) => {
    if ((season.season_number ?? 0) <= 0 || (season.episode_count ?? 0) <= 0) {
      return false;
    }

    if (season.episodes_aired !== undefined) {
      return season.episodes_aired > 0;
    }

    return hasAiredOnOrBeforeToday(season.air_date, today);
  });
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
