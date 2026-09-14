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
import { normalizeMovieStatus, normalizeSeriesStatus } from "@/lib/media/status";
import type { MoviePayload, TmdbSeries } from "@/lib/types";

function pickSeriesCertificate(body: TmdbSeries) {
  if (!body.content_ratings?.results) {
    return null;
  }

  const ratingCountry =
    body.content_ratings.results.find((r) => r.iso_3166_1 === "IN") ??
    body.content_ratings.results.find(
      (r) => r.iso_3166_1 === body.origin_country?.[0],
    );

  return ratingCountry?.rating ?? null;
}

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
  const certificate = body.certification?.certification || null;
  const voteAvg =
    typeof body.vote_average === "number" ? body.vote_average : null;

  await db
    .insert(movies)
    .values({
      tmdbId,
      title: body.title || "Unknown",
      posterPath: body.poster_path || null,
      releaseDate: body.release_date || null,
      voteAverage: voteAvg,
      status: normalizeMovieStatus(body.status),
      originalLanguage: body.original_language || null,
      originCountry: body.origin_country?.[0] || null,
      certificate: certificate || null,
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
  const voteAvg =
    typeof body.vote_average === "number" ? body.vote_average : null;

  await db
    .insert(series)
    .values({
      tmdbId,
      name: body.name || "Unknown",
      posterPath: body.poster_path || null,
      firstAirDate: body.first_air_date || null,
      lastAirDate: body.last_air_date || null,
      totalNumberOfEpisodes: body.number_of_episodes || null,
      totalNumberOfSeasons: body.number_of_seasons || null,
      voteAverage: voteAvg,
      status: normalizeSeriesStatus(body.status),
      originalLanguage: body.original_language || null,
      originCountry: Array.isArray(body.origin_country)
        ? body.origin_country[0]
        : null,
      certificate: pickSeriesCertificate(body),
      type: body.type || null,
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
  if (!seasonPayloads || !Array.isArray(seasonPayloads)) {
    return;
  }

  const seasonsToInsert = seasonPayloads.filter(
    (
      season,
    ): season is typeof season & { id: number; season_number: number } =>
      season.id !== undefined && season.season_number !== undefined,
  );

  if (seasonsToInsert.length === 0) {
    return;
  }

  const db = getDb();
  await db
    .insert(seasons)
    .values(
      seasonsToInsert.map((season) => ({
        seriesId: catalogSeriesId,
        tmdbId: season.id,
        name: season.name || null,
        seasonNumber: season.season_number,
        episodeCount: season.episode_count || 0,
        airDate: season.air_date || null,
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
    const genreTmdbIds = (body.genres ?? [])
      .map((genre) => genre.id)
      .filter((id): id is number => typeof id === "number");
    await linkMovieGenres(movie.id, genreTmdbIds);
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
    const genreTmdbIds = (body.genres ?? [])
      .map((genre) => genre.id)
      .filter((id): id is number => typeof id === "number");

    if (genreTmdbIds.length > 0) {
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
              .where(inArray(genres.tmdbId, genreTmdbIds)),
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
