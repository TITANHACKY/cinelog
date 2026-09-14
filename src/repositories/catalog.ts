import { eq, inArray, sql } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  genres,
  movies,
  moviesToGenres,
  seasons,
  series,
  seriesToGenres,
} from "@/db/schema";
import {
  catalogSeasonsFromTmdb,
  genreTmdbIds as tmdbGenreIds,
  mapTmdbMovieToCatalog,
  mapTmdbSeriesToCatalog,
} from "@/lib/tmdb/catalog-fields";
import type { MoviePayload, TmdbSeries } from "@/lib/types";

export async function findCatalogMovieByTmdbId(tmdbId: number) {
  return getDb()
    .select()
    .from(movies)
    .where(eq(movies.tmdbId, tmdbId))
    .get();
}

export async function findCatalogSeriesByTmdbId(tmdbId: number) {
  return getDb()
    .select()
    .from(series)
    .where(eq(series.tmdbId, tmdbId))
    .get();
}

export async function upsertCatalogMovie(tmdbId: number, body: MoviePayload) {
  const db = getDb();
  const fields = mapTmdbMovieToCatalog(body);

  await db
    .insert(movies)
    .values({
      tmdbId,
      ...fields,
    })
    .onConflictDoNothing();

  const catalogMovie = await findCatalogMovieByTmdbId(tmdbId);
  if (!catalogMovie) {
    throw new Error(`Failed to upsert catalog movie for tmdb_id ${tmdbId}`);
  }

  return catalogMovie;
}

export async function upsertCatalogSeries(tmdbId: number, body: TmdbSeries) {
  const db = getDb();
  const fields = mapTmdbSeriesToCatalog(body);

  await db
    .insert(series)
    .values({
      tmdbId,
      ...fields,
    })
    .onConflictDoNothing();

  const catalogSeries = await findCatalogSeriesByTmdbId(tmdbId);
  if (!catalogSeries) {
    throw new Error(`Failed to upsert catalog series for tmdb_id ${tmdbId}`);
  }

  return catalogSeries;
}

export async function upsertCatalogSeasons(
  catalogSeriesId: number,
  seasonPayloads: TmdbSeries["seasons"],
) {
  const seasonsToInsert = catalogSeasonsFromTmdb(seasonPayloads);

  if (seasonsToInsert.length === 0) {
    return;
  }

  const db = getDb();
  await db
    .insert(seasons)
    .values(
      seasonsToInsert.map((season) => ({
        seriesId: catalogSeriesId,
        tmdbId: season.tmdbId,
        name: season.name,
        seasonNumber: season.seasonNumber,
        episodeCount: season.episodeCount,
        airDate: season.airDate,
      })),
    )
    .onConflictDoNothing();
}

export async function linkMovieGenres(
  catalogMovieId: number,
  genreTmdbIds: number[],
) {
  if (genreTmdbIds.length === 0) {
    return;
  }

  const db = getDb();
  await db.insert(moviesToGenres).select(
    db
      .select({
        id: sql<number | null>`null`.as("id"),
        movieId: sql<number>`${catalogMovieId}`.as("movieId"),
        genreId: genres.id,
        createdAt: sql`(unixepoch())`.as("createdAt"),
      })
      .from(genres)
      .where(inArray(genres.tmdbId, genreTmdbIds)),
  ).onConflictDoNothing();
}

export async function linkSeriesGenres(
  catalogSeriesId: number,
  genreTmdbIds: number[],
) {
  if (genreTmdbIds.length === 0) {
    return;
  }

  const db = getDb();
  await db.insert(seriesToGenres).select(
    db
      .select({
        id: sql<number | null>`null`.as("id"),
        seriesId: sql<number>`${catalogSeriesId}`.as("seriesId"),
        genreId: genres.id,
        createdAt: sql`(unixepoch())`.as("createdAt"),
      })
      .from(genres)
      .where(inArray(genres.tmdbId, genreTmdbIds)),
  ).onConflictDoNothing();
}

export async function upsertCatalogMovieWithGenres(
  tmdbId: number,
  body: MoviePayload,
) {
  const catalogMovie = await findCatalogMovieByTmdbId(tmdbId);
  const isNew = !catalogMovie;
  const movie = catalogMovie ?? (await upsertCatalogMovie(tmdbId, body));

  if (isNew) {
    await linkMovieGenres(movie.id, tmdbGenreIds(body.genres));
  }

  return movie;
}

export async function upsertCatalogSeriesWithGenresAndSeasons(
  tmdbId: number,
  body: TmdbSeries,
) {
  const catalogSeries = await findCatalogSeriesByTmdbId(tmdbId);
  const isNew = !catalogSeries;
  const show =
    catalogSeries ?? (await upsertCatalogSeries(tmdbId, body));

  const queries: SqliteBatchQuery[] = [];

  if (isNew) {
    const seriesGenreIds = tmdbGenreIds(body.genres);

    if (seriesGenreIds.length > 0) {
      queries.push(
        getDb()
          .insert(seriesToGenres)
          .select(
            getDb()
              .select({
                id: sql<number | null>`null`.as("id"),
                seriesId: sql<number>`${show.id}`.as("seriesId"),
                genreId: genres.id,
                createdAt: sql`(unixepoch())`.as("createdAt"),
              })
              .from(genres)
              .where(inArray(genres.tmdbId, seriesGenreIds)),
          ),
      );
    }
  }

  await upsertCatalogSeasons(show.id, body.seasons);

  if (queries.length > 0) {
    await getDb().batch(asBatch(queries));
  }

  return show;
}

export async function listCatalogSeasons(catalogSeriesId: number) {
  return getDb()
    .select()
    .from(seasons)
    .where(eq(seasons.seriesId, catalogSeriesId));
}
