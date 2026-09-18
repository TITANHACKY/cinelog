import { WATCH_STATUS } from "@/lib/constants";
import { AppError } from "@/lib/http/errors";
import { hasAiredOnOrBeforeToday } from "@/lib/media/air-date";
import { nowUnixSeconds } from "@/lib/media/display";
import {
  canUpdateSeriesWatchActivity,
  toSeriesStatusDisplay,
} from "@/lib/media/status";
import { getCachedTmdbSeries } from "@/lib/tmdb/cache";
import { pickCastAndDirectors } from "@/lib/tmdb/credits";
import type { TmdbSeries } from "@/lib/types";
import type { SeriesPatchInput } from "@/lib/validations/library";
import {
  applySeriesWatchUpdates,
  deleteUserSeries,
  ensureAllUserSeasonProgress,
  ensureUserSeasonProgress,
  findUserSeriesAndSeasons,
  insertUserSeries,
  type UserSeasonWithCatalog,
  type UserSeriesWithCatalog,
} from "@/repositories/series";
import { isUniqueConstraintError } from "@/lib/db/unique-constraint";
import type { NewUserSeries } from "@/db/schema";

type UserSeriesLibrary = {
  userSeries?: Pick<
    UserSeriesWithCatalog,
    | "impression"
    | "watchStatus"
    | "totalNumberOfEpisodesWatched"
    | "totalNumberOfSeasonsWatched"
  >;
  userSeasons: Pick<
    UserSeasonWithCatalog,
    "seasonNumber" | "episodeCount" | "episodesWatched"
  >[];
};

export type SeriesLibraryFields = {
  is_present_in_watchlist: boolean;
  impression: number | null;
  watch_status: number | null;
  total_number_of_episodes_watched: number;
  total_number_of_seasons_watched: number;
  seasons: Array<{
    season_number: number;
    episode_count: number;
    episodes_watched: number;
  }>;
};

function toSeriesLibraryFields({
  userSeries,
  userSeasons,
}: UserSeriesLibrary): SeriesLibraryFields {
  return {
    is_present_in_watchlist: Boolean(userSeries),
    impression: userSeries?.impression ?? null,
    watch_status: userSeries?.watchStatus ?? null,
    total_number_of_episodes_watched:
      userSeries?.totalNumberOfEpisodesWatched ?? 0,
    total_number_of_seasons_watched:
      userSeries?.totalNumberOfSeasonsWatched ?? 0,
    seasons: userSeasons.map((season) => ({
      season_number: season.seasonNumber,
      episode_count: season.episodeCount,
      episodes_watched: season.episodesWatched,
    })),
  };
}

function toSeriesDetails(seriesRecord: TmdbSeries, library: UserSeriesLibrary) {
  const progressBySeasonNumber = new Map(
    library.userSeasons.map((season) => [
      season.seasonNumber,
      season.episodesWatched,
    ]),
  );
  const libraryFields = toSeriesLibraryFields(library);

  return {
    backdrop_path: seriesRecord.backdrop_path,
    created_by: seriesRecord.created_by ?? [],
    first_air_date: seriesRecord.first_air_date,
    genres: seriesRecord.genres ?? [],
    id: seriesRecord.id,
    last_air_date: seriesRecord.last_air_date,
    name: seriesRecord.name,
    networks: seriesRecord.networks ?? [],
    number_of_episodes: seriesRecord.number_of_episodes,
    number_of_seasons: seriesRecord.number_of_seasons,
    overview: seriesRecord.overview,
    poster_path: seriesRecord.poster_path,
    production_companies: seriesRecord.production_companies ?? [],
    seasons: (seriesRecord.seasons ?? []).map((season) => ({
      ...season,
      episodes_watched:
        season.season_number === undefined
          ? 0
          : (progressBySeasonNumber.get(season.season_number) ?? 0),
    })),
    status: toSeriesStatusDisplay(seriesRecord.status),
    tagline: seriesRecord.tagline,
    type: seriesRecord.type,
    vote_average: seriesRecord.vote_average,
    original_language: seriesRecord.original_language,
    origin_country: seriesRecord.origin_country ?? [],
    imdb_id: seriesRecord.imdb_id ?? seriesRecord.external_ids?.imdb_id,
    content_ratings:
      seriesRecord.content_ratings?.results?.find(
        (rating) => rating.iso_3166_1 === "IN",
      ) ?? {},
    credits: pickCastAndDirectors(seriesRecord.credits),
    is_present_in_watchlist: libraryFields.is_present_in_watchlist,
    impression: libraryFields.impression,
    watch_status: libraryFields.watch_status,
    total_number_of_episodes_watched:
      libraryFields.total_number_of_episodes_watched,
    total_number_of_seasons_watched:
      libraryFields.total_number_of_seasons_watched,
  };
}

export async function getSeriesDetails(tmdbId: number, userId?: number) {
  const seriesRecord = await getCachedTmdbSeries(tmdbId);
  const library = userId
    ? await findUserSeriesAndSeasons(tmdbId, userId)
    : { userSeries: undefined, userSeasons: [] };

  return toSeriesDetails(seriesRecord, library);
}

function toSeriesInsertPayload(body: TmdbSeries): TmdbSeries {
  const ratings = body.content_ratings as
    | TmdbSeries["content_ratings"]
    | { iso_3166_1?: string; rating?: string }
    | undefined;

  if (ratings && !("results" in ratings) && "rating" in ratings) {
    return {
      ...body,
      content_ratings: { results: [ratings] },
    };
  }

  return body;
}

export async function addSeriesToLibrary(tmdbId: number, userId: number) {
  const seriesRecord = await getCachedTmdbSeries(tmdbId);
  const payload = toSeriesInsertPayload(seriesRecord);

  try {
    await insertUserSeries(tmdbId, userId, payload);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("Series already exists in library", 409);
    }
    throw error;
  }

  const details = toSeriesDetails(seriesRecord, {
    userSeries: undefined,
    userSeasons: [],
  });

  return {
    ...details,
    is_present_in_watchlist: true,
    impression: null,
    watch_status: 0,
    total_number_of_episodes_watched: 0,
    total_number_of_seasons_watched: 0,
    seasons: (details.seasons ?? []).map((season) => ({
      ...season,
      episodes_watched: 0,
    })),
  };
}

export async function removeSeriesFromLibrary(tmdbId: number, userId: number) {
  const deleted = await deleteUserSeries(tmdbId, userId);

  if (deleted.length === 0) {
    throw new AppError("Series not found in library", 404);
  }
}

export async function updateSeriesInLibrary(
  tmdbId: number,
  userId: number,
  body: SeriesPatchInput,
): Promise<SeriesLibraryFields> {
  const { userSeries: existingSeries, userSeasons: allSeasons } =
    await findUserSeriesAndSeasons(tmdbId, userId);

  if (!existingSeries) {
    throw new AppError("Series not found in library", 404);
  }

  const isWatchActivityUpdate =
    body.watch_status !== undefined ||
    body.impression !== undefined ||
    body.mark_season_to_watched !== undefined ||
    body.mark_episode_to_watched !== undefined;

  if (
    isWatchActivityUpdate &&
    !canUpdateSeriesWatchActivity(existingSeries.status)
  ) {
    throw new AppError(
      "Cannot update watch activity for this series status",
      400,
    );
  }

  const now = nowUnixSeconds();

  let finalWatchStatus = existingSeries.watchStatus;
  let finalCompletedAt = existingSeries.completedAt;
  let finalLastWatchedAt = existingSeries.lastWatchedAt;
  let finalTotalEpsWatched = existingSeries.totalNumberOfEpisodesWatched || 0;
  let finalTotalSeasonsWatched =
    existingSeries.totalNumberOfSeasonsWatched || 0;

  let updateImpression = false;
  let newImpressionValue: number | null = existingSeries.impression;

  if (body.impression !== undefined) {
    updateImpression = true;
    newImpressionValue = body.impression;
  }

  let didProgressUpdate = false;
  let seasonUpdate:
    | {
        progressId: number;
        values: {
          episodesWatched: number;
          lastWatchedAt: string;
          completedAt: string | null;
          updatedAt: string;
        };
      }
    | undefined;
  let resetAllSeasons:
    | {
        episodesWatched: number;
        completedAt: null;
        lastWatchedAt: null;
        updatedAt: string;
      }
    | undefined;
  let completeAllSeasonsAt: string | undefined;

  if (
    body.mark_season_to_watched !== undefined &&
    body.mark_episode_to_watched !== undefined
  ) {
    const targetSeason = allSeasons.find(
      (s) => s.seasonNumber === body.mark_season_to_watched,
    );
    if (!targetSeason) {
      throw new AppError("Season not found in library", 404);
    }

    if (!hasAiredOnOrBeforeToday(targetSeason.airDate)) {
      throw new AppError("Cannot mark a season that has not aired yet", 400);
    }

    const epsWatched = Math.min(
      body.mark_episode_to_watched,
      targetSeason.episodeCount,
    );
    const seasonCompletedAt =
      epsWatched === targetSeason.episodeCount && epsWatched > 0 ? now : null;

    const progressId =
      targetSeason.progressId ??
      (await ensureUserSeasonProgress(
        existingSeries.id,
        targetSeason.seasonId,
      ));

    seasonUpdate = {
      progressId,
      values: {
        episodesWatched: epsWatched,
        lastWatchedAt: now,
        completedAt: seasonCompletedAt,
        updatedAt: now,
      },
    };

    targetSeason.episodesWatched = epsWatched;
    targetSeason.completedAt = seasonCompletedAt;
    targetSeason.lastWatchedAt = now;
    didProgressUpdate = true;
  }

  if (body.watch_status !== undefined) {
    finalWatchStatus = body.watch_status;
    const planToWatchValue =
      Object.values(WATCH_STATUS).find(
        (s) => s.display_value === "Plan to Watch",
      )?.value ?? 0;
    const completedValue =
      Object.values(WATCH_STATUS).find((s) => s.display_value === "Completed")
        ?.value ?? 2;

    if (finalWatchStatus === planToWatchValue) {
      finalTotalEpsWatched = 0;
      finalTotalSeasonsWatched = 0;
      finalCompletedAt = null;
      finalLastWatchedAt = null;
      await ensureAllUserSeasonProgress(
        existingSeries.id,
        existingSeries.seriesId,
      );
      resetAllSeasons = {
        episodesWatched: 0,
        completedAt: null,
        lastWatchedAt: null,
        updatedAt: now,
      };
    } else if (finalWatchStatus === completedValue) {
      finalCompletedAt = now;
      finalLastWatchedAt = now;
      finalTotalEpsWatched = existingSeries.totalNumberOfEpisodes || 0;
      finalTotalSeasonsWatched = existingSeries.totalNumberOfSeasons || 0;
      await ensureAllUserSeasonProgress(
        existingSeries.id,
        existingSeries.seriesId,
      );
      completeAllSeasonsAt = now;
    } else {
      finalCompletedAt = null;
    }
  } else if (didProgressUpdate) {
    finalTotalEpsWatched = allSeasons.reduce(
      (sum, s) => sum + s.episodesWatched,
      0,
    );
    finalTotalSeasonsWatched = allSeasons.filter(
      (s) => s.episodesWatched === s.episodeCount && s.episodeCount > 0,
    ).length;
    finalLastWatchedAt = now;

    const totalEps = existingSeries.totalNumberOfEpisodes || 0;
    if (totalEps > 0 && finalTotalEpsWatched >= totalEps) {
      const completedValue =
        Object.values(WATCH_STATUS).find(
          (s) => s.display_value === "Completed",
        )?.value ?? 2;
      finalWatchStatus = completedValue;
      finalCompletedAt = now;
    } else {
      const watchingValue =
        Object.values(WATCH_STATUS).find(
          (s) => s.display_value === "Watching",
        )?.value ?? 1;
      finalWatchStatus = watchingValue;
      finalCompletedAt = null;
    }
  }

  const seriesUpdate: Partial<NewUserSeries> = {
    watchStatus: finalWatchStatus,
    completedAt: finalCompletedAt,
    lastWatchedAt: finalLastWatchedAt,
    totalNumberOfEpisodesWatched: finalTotalEpsWatched,
    totalNumberOfSeasonsWatched: finalTotalSeasonsWatched,
    updatedAt: now,
  };

  if (updateImpression) {
    seriesUpdate.impression = newImpressionValue;
  }

  await applySeriesWatchUpdates({
    userSeriesId: existingSeries.id,
    catalogSeriesId: existingSeries.seriesId,
    seriesValues: seriesUpdate,
    seasonUpdate,
    resetAllSeasons,
    completeAllSeasonsAt,
  });

  return toSeriesLibraryFields(await findUserSeriesAndSeasons(tmdbId, userId));
}
