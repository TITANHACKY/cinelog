import { WATCH_STATUS } from "@/lib/constants";
import { AppError } from "@/lib/http/errors";
import { nowUnixSeconds } from "@/lib/media/display";
import {
  computeSeasonEpisodesAired,
  computeTotalEpisodesAired,
} from "@/lib/media/series-progress";
import {
  canUpdateSeriesWatchActivity,
  toSeriesStatusDisplay,
} from "@/lib/media/status";
import { getCachedTmdbSeries } from "@/lib/tmdb/cache";
import { pickSeriesCertification } from "@/lib/tmdb/catalog-fields";
import {
  extractAllCast,
  extractDepartments,
  pickCastAndDirectors,
} from "@/lib/tmdb/credits";
import { extractTrailer } from "@/lib/tmdb/videos";
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
  const episodeAirContext = {
    lastEpisode: seriesRecord.last_episode_to_air,
    nextEpisode: seriesRecord.next_episode_to_air,
  };
  const seasons = (seriesRecord.seasons ?? []).map((season) => {
    const seasonNumber = season.season_number ?? 0;
    const episodeCount = season.episode_count ?? 0;
    const episodesAired = computeSeasonEpisodesAired(
      seasonNumber,
      episodeCount,
      episodeAirContext,
    );

    return {
      ...season,
      episodes_aired: episodesAired,
      episodes_watched:
        season.season_number === undefined
          ? 0
          : (progressBySeasonNumber.get(season.season_number) ?? 0),
    };
  });
  const totalEpisodesAired = computeTotalEpisodesAired(
    seasons,
    episodeAirContext,
  );
  const certification = pickSeriesCertification(seriesRecord);
  const trailer = extractTrailer(seriesRecord.videos);
  const departments = extractDepartments(seriesRecord.credits);
  const allCast = extractAllCast(seriesRecord.credits);
  const watchProviders = seriesRecord["watch/providers"]?.results ?? {};
  const availableCountries = Object.keys(watchProviders);
  const leadStudio = seriesRecord.production_companies?.[0]?.name ?? null;
  const network = seriesRecord.networks?.[0]?.name ?? null;

  return {
    backdrop_path: seriesRecord.backdrop_path,
    created_by: seriesRecord.created_by ?? [],
    first_air_date: seriesRecord.first_air_date,
    genres: seriesRecord.genres ?? [],
    id: seriesRecord.id,
    last_air_date: seriesRecord.last_air_date,
    name: seriesRecord.name,
    number_of_episodes: seriesRecord.number_of_episodes,
    number_of_seasons: seriesRecord.number_of_seasons,
    overview: seriesRecord.overview,
    poster_path: seriesRecord.poster_path,
    production_companies: seriesRecord.production_companies ?? [],
    seasons,
    status: toSeriesStatusDisplay(seriesRecord.status),
    type: seriesRecord.type,
    vote_average: seriesRecord.vote_average,
    original_language: seriesRecord.original_language,
    origin_country: seriesRecord.origin_country ?? [],
    imdb_id: seriesRecord.imdb_id ?? seriesRecord.external_ids?.imdb_id,
    certification: certification
      ? {
          certification: certification.certification,
          iso_3166_1: certification.iso_3166_1,
        }
      : null,
    lead_studio: leadStudio,
    network,
    trailer,
    watch_providers: watchProviders,
    available_countries: availableCountries,
    spoken_languages: (seriesRecord.spoken_languages ?? []).map((language) => ({
      iso_639_1: language.iso_639_1 ?? "",
      english_name: language.english_name ?? "",
      name: language.name ?? "",
    })),
    departments,
    all_cast: allCast,
    next_episode_to_air: seriesRecord.next_episode_to_air ?? null,
    last_episode_to_air: seriesRecord.last_episode_to_air ?? null,
    total_episodes_aired: totalEpisodesAired,
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

    const seriesRecord = await getCachedTmdbSeries(tmdbId);
    const episodesAired = computeSeasonEpisodesAired(
      targetSeason.seasonNumber,
      targetSeason.episodeCount,
      {
        lastEpisode: seriesRecord.last_episode_to_air,
        nextEpisode: seriesRecord.next_episode_to_air,
      },
    );

    if (episodesAired <= 0) {
      throw new AppError("Cannot mark a season that has not aired yet", 400);
    }

    if (body.mark_episode_to_watched > episodesAired) {
      throw new AppError("Cannot mark episodes that have not aired yet", 400);
    }

    const epsWatched = Math.min(
      body.mark_episode_to_watched,
      targetSeason.episodeCount,
      episodesAired,
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

    if (finalWatchStatus === WATCH_STATUS[0].value) {
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
    } else if (finalWatchStatus === WATCH_STATUS[2].value) {
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
      finalWatchStatus = WATCH_STATUS[2].value;
      finalCompletedAt = now;
    } else {
      finalWatchStatus = WATCH_STATUS[1].value;
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
