import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  genres,
  movies,
  moviesToGenres,
  seasons,
  series,
  seriesToGenres,
  userSeasonProgress,
  userSeries,
  type Movie,
  type Season,
  type Series,
} from "@/db/schema";
import { WATCH_STATUS } from "@/lib/constants";
import { nowUnixSeconds } from "@/lib/media/display";
import type {
  CatalogMovieFields,
  CatalogSeasonFields,
  CatalogSeriesFields,
} from "@/lib/tmdb/catalog-fields";

const BATCH_SIZE = 40;

export type CatalogSyncSnapshot = {
  movies: Movie[];
  series: Series[];
  seasonsBySeriesId: Map<number, Season[]>;
  movieGenreTmdbIds: Map<number, Set<number>>;
  seriesGenreTmdbIds: Map<number, Set<number>>;
  genreIdByTmdbId: Map<number, number>;
  userSeriesIdsBySeriesId: Map<number, number[]>;
};

export type CatalogSyncMutations = {
  movieUpdates: Array<{ id: number; values: Partial<CatalogMovieFields> }>;
  seriesUpdates: Array<{ id: number; values: Partial<CatalogSeriesFields> }>;
  seasonUpdates: Array<{ id: number; values: Partial<CatalogSeasonFields> }>;
  newSeasons: Array<CatalogSeasonFields & { seriesId: number }>;
  movieGenreLinks: Array<{ movieId: number; genreTmdbIds: number[] }>;
  seriesGenreLinks: Array<{ seriesId: number; genreTmdbIds: number[] }>;
  movieGenreUnlinks: Array<{ movieId: number; genreIds: number[] }>;
  seriesGenreUnlinks: Array<{ seriesId: number; genreIds: number[] }>;
  reopenWatchStatusSeriesIds: number[];
};

const COMPLETED_WATCH_STATUS = WATCH_STATUS[2].value;
const WATCHING_WATCH_STATUS = WATCH_STATUS[1].value;

export type UserSeriesReopenPlan = {
  userSeriesId: number;
  seriesId: number;
  totalEpisodesWatched: number;
  totalSeasonsWatched: number;
  seasonProgressIdsToClear: number[];
};

type SeasonProgressSnapshot = {
  progressId: number | null;
  episodesWatched: number;
  episodeCount: number;
  completedAt: string | null;
};

function uniqueSeriesIds(seriesIds: number[]) {
  return [...new Set(seriesIds)];
}

function computeWatchTotals(seasonRows: SeasonProgressSnapshot[]) {
  const totalEpisodesWatched = seasonRows.reduce(
    (sum, row) =>
      sum + Math.min(Math.max(row.episodesWatched, 0), row.episodeCount),
    0,
  );
  const totalSeasonsWatched = seasonRows.filter(
    (row) => row.episodeCount > 0 && row.episodesWatched >= row.episodeCount,
  ).length;

  return { totalEpisodesWatched, totalSeasonsWatched };
}

function isSeriesFullyWatched(
  totalEpisodesWatched: number,
  catalogTotalEpisodes: number | null,
) {
  const totalEpisodes = catalogTotalEpisodes ?? 0;
  return totalEpisodes > 0 && totalEpisodesWatched >= totalEpisodes;
}

function planUserSeriesReopen(input: {
  userSeriesId: number;
  seriesId: number;
  catalogTotalEpisodes: number | null;
  seasonRows: SeasonProgressSnapshot[];
}): UserSeriesReopenPlan | null {
  const { totalEpisodesWatched, totalSeasonsWatched } = computeWatchTotals(
    input.seasonRows,
  );

  if (
    isSeriesFullyWatched(totalEpisodesWatched, input.catalogTotalEpisodes)
  ) {
    return null;
  }

  const seasonProgressIdsToClear = input.seasonRows
    .filter(
      (row) =>
        row.progressId !== null &&
        row.episodeCount > 0 &&
        row.episodesWatched < row.episodeCount &&
        row.completedAt !== null,
    )
    .map((row) => row.progressId!);

  return {
    userSeriesId: input.userSeriesId,
    seriesId: input.seriesId,
    totalEpisodesWatched,
    totalSeasonsWatched,
    seasonProgressIdsToClear,
  };
}

function projectedCatalogTotalEpisodes(
  show: Series,
  mutations: CatalogSyncMutations,
) {
  const update = mutations.seriesUpdates.find((row) => row.id === show.id);
  if (update?.values.totalNumberOfEpisodes !== undefined) {
    return update.values.totalNumberOfEpisodes;
  }
  return show.totalNumberOfEpisodes;
}

function projectedSeasonRows(
  show: Series,
  snapshot: CatalogSyncSnapshot,
  mutations: CatalogSyncMutations,
): Array<{ seasonId: number | null; seasonNumber: number; episodeCount: number }> {
  const existingSeasons = snapshot.seasonsBySeriesId.get(show.id) ?? [];
  const updatedById = new Map(
    mutations.seasonUpdates
      .filter((update) => existingSeasons.some((season) => season.id === update.id))
      .map((update) => [update.id, update.values]),
  );

  const rows: Array<{
    seasonId: number | null;
    seasonNumber: number;
    episodeCount: number;
  }> = existingSeasons.map((season) => ({
    seasonId: season.id,
    seasonNumber: season.seasonNumber,
    episodeCount:
      updatedById.get(season.id)?.episodeCount ?? season.episodeCount,
  }));

  for (const season of mutations.newSeasons.filter(
    (row) => row.seriesId === show.id,
  )) {
    rows.push({
      seasonId: null,
      seasonNumber: season.seasonNumber,
      episodeCount: season.episodeCount,
    });
  }

  return rows;
}

export function markSeriesForWatchStatusReopen(
  mutations: CatalogSyncMutations,
  seriesId: number,
) {
  if (!mutations.reopenWatchStatusSeriesIds.includes(seriesId)) {
    mutations.reopenWatchStatusSeriesIds.push(seriesId);
  }
}

export async function loadCatalogSyncSnapshot(): Promise<CatalogSyncSnapshot> {
  const db = getDb();
  const [
    movieRows,
    seriesRows,
    seasonRows,
    movieGenreRows,
    seriesGenreRows,
    genreRows,
    userSeriesRows,
  ] = await Promise.all([
    db.select().from(movies),
    db.select().from(series),
    db.select().from(seasons),
    db
      .select({
        movieId: moviesToGenres.movieId,
        genreTmdbId: genres.tmdbId,
      })
      .from(moviesToGenres)
      .innerJoin(genres, eq(moviesToGenres.genreId, genres.id)),
    db
      .select({
        seriesId: seriesToGenres.seriesId,
        genreTmdbId: genres.tmdbId,
      })
      .from(seriesToGenres)
      .innerJoin(genres, eq(seriesToGenres.genreId, genres.id)),
    db.select({ id: genres.id, tmdbId: genres.tmdbId }).from(genres),
    db
      .select({ id: userSeries.id, seriesId: userSeries.seriesId })
      .from(userSeries),
  ]);

  const seasonsBySeriesId = new Map<number, Season[]>();
  for (const season of seasonRows) {
    const existing = seasonsBySeriesId.get(season.seriesId) ?? [];
    existing.push(season);
    seasonsBySeriesId.set(season.seriesId, existing);
  }

  const movieGenreTmdbIds = new Map<number, Set<number>>();
  for (const row of movieGenreRows) {
    const existing = movieGenreTmdbIds.get(row.movieId) ?? new Set<number>();
    existing.add(row.genreTmdbId);
    movieGenreTmdbIds.set(row.movieId, existing);
  }

  const seriesGenreTmdbIds = new Map<number, Set<number>>();
  for (const row of seriesGenreRows) {
    const existing = seriesGenreTmdbIds.get(row.seriesId) ?? new Set<number>();
    existing.add(row.genreTmdbId);
    seriesGenreTmdbIds.set(row.seriesId, existing);
  }

  const genreIdByTmdbId = new Map(
    genreRows.map((genre) => [genre.tmdbId, genre.id]),
  );

  const userSeriesIdsBySeriesId = new Map<number, number[]>();
  for (const row of userSeriesRows) {
    const existing = userSeriesIdsBySeriesId.get(row.seriesId) ?? [];
    existing.push(row.id);
    userSeriesIdsBySeriesId.set(row.seriesId, existing);
  }

  return {
    movies: movieRows,
    series: seriesRows,
    seasonsBySeriesId,
    movieGenreTmdbIds,
    seriesGenreTmdbIds,
    genreIdByTmdbId,
    userSeriesIdsBySeriesId,
  };
}

async function runBatches(queries: SqliteBatchQuery[]) {
  if (queries.length === 0) {
    return;
  }

  const db = getDb();
  for (let index = 0; index < queries.length; index += BATCH_SIZE) {
    const chunk = queries.slice(index, index + BATCH_SIZE);
    await db.batch(asBatch(chunk));
  }
}

function movieGenreInsert(
  movieId: number,
  genreTmdbIds: number[],
): SqliteBatchQuery {
  return getDb()
    .insert(moviesToGenres)
    .select(
      getDb()
        .select({
          id: sql<number | null>`null`.as("id"),
          movieId: sql<number>`${movieId}`.as("movieId"),
          genreId: genres.id,
          createdAt: sql`(unixepoch())`.as("createdAt"),
        })
        .from(genres)
        .where(inArray(genres.tmdbId, genreTmdbIds)),
    )
    .onConflictDoNothing();
}

function seriesGenreInsert(
  seriesId: number,
  genreTmdbIds: number[],
): SqliteBatchQuery {
  return getDb()
    .insert(seriesToGenres)
    .select(
      getDb()
        .select({
          id: sql<number | null>`null`.as("id"),
          seriesId: sql<number>`${seriesId}`.as("seriesId"),
          genreId: genres.id,
          createdAt: sql`(unixepoch())`.as("createdAt"),
        })
        .from(genres)
        .where(inArray(genres.tmdbId, genreTmdbIds)),
    )
    .onConflictDoNothing();
}

function movieGenreDelete(movieId: number, genreIds: number[]): SqliteBatchQuery {
  return getDb()
    .delete(moviesToGenres)
    .where(
      and(
        eq(moviesToGenres.movieId, movieId),
        inArray(moviesToGenres.genreId, genreIds),
      ),
    );
}

function seriesGenreDelete(
  seriesId: number,
  genreIds: number[],
): SqliteBatchQuery {
  return getDb()
    .delete(seriesToGenres)
    .where(
      and(
        eq(seriesToGenres.seriesId, seriesId),
        inArray(seriesToGenres.genreId, genreIds),
      ),
    );
}

export async function previewUserSeriesReopens(
  mutations: CatalogSyncMutations,
  snapshot: CatalogSyncSnapshot,
): Promise<UserSeriesReopenPlan[]> {
  const seriesIds = uniqueSeriesIds(mutations.reopenWatchStatusSeriesIds);
  if (seriesIds.length === 0) {
    return [];
  }

  const db = getDb();
  const completedRows = await db
    .select({
      userSeriesId: userSeries.id,
      seriesId: userSeries.seriesId,
    })
    .from(userSeries)
    .where(
      and(
        inArray(userSeries.seriesId, seriesIds),
        eq(userSeries.watchStatus, COMPLETED_WATCH_STATUS),
      ),
    );

  if (completedRows.length === 0) {
    return [];
  }

  const progressRows = await db
    .select({
      userSeriesId: userSeasonProgress.userSeriesId,
      progressId: userSeasonProgress.id,
      seasonId: seasons.id,
      episodesWatched: userSeasonProgress.episodesWatched,
      episodeCount: seasons.episodeCount,
      completedAt: userSeasonProgress.completedAt,
    })
    .from(userSeasonProgress)
    .innerJoin(seasons, eq(userSeasonProgress.seasonId, seasons.id))
    .where(
      inArray(
        userSeasonProgress.userSeriesId,
        completedRows.map((row) => row.userSeriesId),
      ),
    );

  const plans: UserSeriesReopenPlan[] = [];

  for (const row of completedRows) {
    const show = snapshot.series.find((seriesRow) => seriesRow.id === row.seriesId);
    if (!show) {
      continue;
    }

    const projectedSeasons = projectedSeasonRows(show, snapshot, mutations);
    const progressBySeasonId = new Map(
      progressRows
        .filter((progressRow) => progressRow.userSeriesId === row.userSeriesId)
        .map((progressRow) => [
          progressRow.seasonId,
          {
            progressId: progressRow.progressId,
            episodesWatched: progressRow.episodesWatched,
            episodeCount: progressRow.episodeCount,
            completedAt: progressRow.completedAt,
          },
        ]),
    );

    const seasonRows: SeasonProgressSnapshot[] = projectedSeasons.map(
      (season) => {
        const existing =
          season.seasonId !== null
            ? progressBySeasonId.get(season.seasonId)
            : undefined;

        return {
          progressId: existing?.progressId ?? null,
          episodesWatched: existing?.episodesWatched ?? 0,
          episodeCount: season.episodeCount,
          completedAt: existing?.completedAt ?? null,
        };
      },
    );

    const plan = planUserSeriesReopen({
      userSeriesId: row.userSeriesId,
      seriesId: row.seriesId,
      catalogTotalEpisodes: projectedCatalogTotalEpisodes(show, mutations),
      seasonRows,
    });

    if (plan) {
      plans.push(plan);
    }
  }

  return plans;
}

async function loadUserSeriesReopenPlans(
  seriesIds: number[],
): Promise<UserSeriesReopenPlan[]> {
  const uniqueIds = uniqueSeriesIds(seriesIds);
  if (uniqueIds.length === 0) {
    return [];
  }

  const db = getDb();
  const completedRows = await db
    .select({
      userSeriesId: userSeries.id,
      seriesId: userSeries.seriesId,
      catalogTotalEpisodes: series.totalNumberOfEpisodes,
    })
    .from(userSeries)
    .innerJoin(series, eq(userSeries.seriesId, series.id))
    .where(
      and(
        inArray(userSeries.seriesId, uniqueIds),
        eq(userSeries.watchStatus, COMPLETED_WATCH_STATUS),
      ),
    );

  if (completedRows.length === 0) {
    return [];
  }

  const seasonProgressRows = await db
    .select({
      userSeriesId: userSeries.id,
      progressId: userSeasonProgress.id,
      episodesWatched: userSeasonProgress.episodesWatched,
      episodeCount: seasons.episodeCount,
      completedAt: userSeasonProgress.completedAt,
    })
    .from(seasons)
    .innerJoin(userSeries, eq(seasons.seriesId, userSeries.seriesId))
    .leftJoin(
      userSeasonProgress,
      and(
        eq(userSeasonProgress.userSeriesId, userSeries.id),
        eq(userSeasonProgress.seasonId, seasons.id),
      ),
    )
    .where(
      and(
        inArray(userSeries.id, completedRows.map((row) => row.userSeriesId)),
        inArray(seasons.seriesId, uniqueIds),
      ),
    );

  const seasonRowsByUserSeriesId = new Map<number, SeasonProgressSnapshot[]>();
  for (const row of seasonProgressRows) {
    const existing = seasonRowsByUserSeriesId.get(row.userSeriesId) ?? [];
    existing.push({
      progressId: row.progressId ?? null,
      episodesWatched: row.episodesWatched ?? 0,
      episodeCount: row.episodeCount,
      completedAt: row.completedAt ?? null,
    });
    seasonRowsByUserSeriesId.set(row.userSeriesId, existing);
  }

  const plans: UserSeriesReopenPlan[] = [];

  for (const row of completedRows) {
    const plan = planUserSeriesReopen({
      userSeriesId: row.userSeriesId,
      seriesId: row.seriesId,
      catalogTotalEpisodes: row.catalogTotalEpisodes,
      seasonRows: seasonRowsByUserSeriesId.get(row.userSeriesId) ?? [],
    });

    if (plan) {
      plans.push(plan);
    }
  }

  return plans;
}

async function applyUserSeriesReopenPlans(
  plans: UserSeriesReopenPlan[],
  updatedAt: string,
): Promise<{ reopened: number; seasonProgressUpdated: number }> {
  if (plans.length === 0) {
    return { reopened: 0, seasonProgressUpdated: 0 };
  }

  const db = getDb();
  const queries: SqliteBatchQuery[] = [];
  const seasonProgressIds = plans.flatMap((plan) => plan.seasonProgressIdsToClear);

  if (seasonProgressIds.length > 0) {
    queries.push(
      db
        .update(userSeasonProgress)
        .set({ completedAt: null, updatedAt })
        .where(
          and(
            inArray(userSeasonProgress.id, seasonProgressIds),
            isNotNull(userSeasonProgress.completedAt),
          ),
        ),
    );
  }

  for (const plan of plans) {
    queries.push(
      db
        .update(userSeries)
        .set({
          watchStatus: WATCHING_WATCH_STATUS,
          completedAt: null,
          totalNumberOfEpisodesWatched: plan.totalEpisodesWatched,
          totalNumberOfSeasonsWatched: plan.totalSeasonsWatched,
          updatedAt,
        })
        .where(eq(userSeries.id, plan.userSeriesId)),
    );
  }

  await runBatches(queries);

  return {
    reopened: plans.length,
    seasonProgressUpdated: seasonProgressIds.length,
  };
}

export async function applyCatalogSyncMutations(
  mutations: CatalogSyncMutations,
): Promise<{
  written: number;
  progressInserted: number;
  userSeriesReopened: number;
}> {
  const updatedAt = nowUnixSeconds();
  const queries: SqliteBatchQuery[] = [];

  for (const update of mutations.movieUpdates) {
    queries.push(
      getDb()
        .update(movies)
        .set({ ...update.values, updatedAt })
        .where(eq(movies.id, update.id)),
    );
  }

  for (const update of mutations.seriesUpdates) {
    queries.push(
      getDb()
        .update(series)
        .set({ ...update.values, updatedAt })
        .where(eq(series.id, update.id)),
    );
  }

  for (const update of mutations.seasonUpdates) {
    queries.push(
      getDb()
        .update(seasons)
        .set({ ...update.values, updatedAt })
        .where(eq(seasons.id, update.id)),
    );
  }

  for (const link of mutations.movieGenreLinks) {
    queries.push(movieGenreInsert(link.movieId, link.genreTmdbIds));
  }

  for (const link of mutations.seriesGenreLinks) {
    queries.push(seriesGenreInsert(link.seriesId, link.genreTmdbIds));
  }

  for (const unlink of mutations.movieGenreUnlinks) {
    queries.push(movieGenreDelete(unlink.movieId, unlink.genreIds));
  }

  for (const unlink of mutations.seriesGenreUnlinks) {
    queries.push(seriesGenreDelete(unlink.seriesId, unlink.genreIds));
  }

  await runBatches(queries);

  let progressInserted = 0;
  const db = getDb();

  if (mutations.newSeasons.length > 0) {
    const inserted = await db
      .insert(seasons)
      .values(
        mutations.newSeasons.map((season) => ({
          seriesId: season.seriesId,
          tmdbId: season.tmdbId,
          name: season.name,
          seasonNumber: season.seasonNumber,
          episodeCount: season.episodeCount,
          airDate: season.airDate,
        })),
      )
      .onConflictDoNothing()
      .returning({
        id: seasons.id,
        seriesId: seasons.seriesId,
      });

    const seriesIds = [...new Set(inserted.map((season) => season.seriesId))];
    const userSeriesRows =
      seriesIds.length === 0
        ? []
        : await db
            .select({ id: userSeries.id, seriesId: userSeries.seriesId })
            .from(userSeries)
            .where(inArray(userSeries.seriesId, seriesIds));

    const userSeriesBySeriesId = new Map<number, number[]>();
    for (const row of userSeriesRows) {
      const existing = userSeriesBySeriesId.get(row.seriesId) ?? [];
      existing.push(row.id);
      userSeriesBySeriesId.set(row.seriesId, existing);
    }

    const progressValues = inserted.flatMap((season) => {
      const ids = userSeriesBySeriesId.get(season.seriesId) ?? [];
      return ids.map((userSeriesId) => ({
        userSeriesId,
        seasonId: season.id,
        episodesWatched: 0,
      }));
    });

    if (progressValues.length > 0) {
      await db
        .insert(userSeasonProgress)
        .values(progressValues)
        .onConflictDoNothing();
      progressInserted = progressValues.length;
    }
  }

  const reopenPlans = await loadUserSeriesReopenPlans(
    mutations.reopenWatchStatusSeriesIds,
  );
  const { reopened: userSeriesReopened } = await applyUserSeriesReopenPlans(
    reopenPlans,
    updatedAt,
  );

  const written =
    mutations.movieUpdates.length +
    mutations.seriesUpdates.length +
    mutations.seasonUpdates.length +
    mutations.newSeasons.length +
    mutations.movieGenreLinks.length +
    mutations.seriesGenreLinks.length +
    mutations.movieGenreUnlinks.length +
    mutations.seriesGenreUnlinks.length +
    progressInserted +
    userSeriesReopened;

  return { written, progressInserted, userSeriesReopened };
}
