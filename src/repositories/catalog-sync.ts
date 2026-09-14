import { and, eq, inArray, sql } from "drizzle-orm";
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
};

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

export async function applyCatalogSyncMutations(
  mutations: CatalogSyncMutations,
): Promise<{ written: number; progressInserted: number }> {
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

  const written =
    mutations.movieUpdates.length +
    mutations.seriesUpdates.length +
    mutations.seasonUpdates.length +
    mutations.newSeasons.length +
    mutations.movieGenreLinks.length +
    mutations.seriesGenreLinks.length +
    mutations.movieGenreUnlinks.length +
    mutations.seriesGenreUnlinks.length +
    progressInserted;

  return { written, progressInserted };
}
