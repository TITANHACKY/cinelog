import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { movies, userMovies } from "@/db/schema";
import type { MoviePayload } from "@/lib/types";
import {
  findCatalogMovieByTmdbId,
  upsertCatalogMovieWithGenres,
} from "@/repositories/catalog";

export async function findUserMovieData(tmdbId: number, userId: number) {
  return getDb()
    .select({
      impression: userMovies.impression,
      watchStatus: userMovies.watchStatus,
    })
    .from(userMovies)
    .innerJoin(movies, eq(userMovies.movieId, movies.id))
    .where(and(eq(movies.tmdbId, tmdbId), eq(userMovies.userId, userId)))
    .get();
}

export async function findUserMovie(tmdbId: number, userId: number) {
  return getDb()
    .select({
      id: userMovies.id,
      userId: userMovies.userId,
      movieId: userMovies.movieId,
      watchStatus: userMovies.watchStatus,
      impression: userMovies.impression,
      createdAt: userMovies.createdAt,
      updatedAt: userMovies.updatedAt,
      lastWatchedAt: userMovies.lastWatchedAt,
      completedAt: userMovies.completedAt,
      status: movies.status,
    })
    .from(userMovies)
    .innerJoin(movies, eq(userMovies.movieId, movies.id))
    .where(and(eq(movies.tmdbId, tmdbId), eq(userMovies.userId, userId)))
    .get();
}

export async function insertUserMovie(
  tmdbId: number,
  userId: number,
  body: MoviePayload,
) {
  const catalogMovie = await upsertCatalogMovieWithGenres(tmdbId, body);

  await getDb().insert(userMovies).values({
    userId,
    movieId: catalogMovie.id,
  });
}

export async function ensureUserMovie(
  tmdbId: number,
  userId: number,
  body?: MoviePayload,
) {
  const existing = await findUserMovie(tmdbId, userId);
  if (existing) {
    return existing;
  }

  const catalogMovie = body
    ? await upsertCatalogMovieWithGenres(tmdbId, body)
    : await findCatalogMovieByTmdbId(tmdbId);

  if (!catalogMovie) {
    throw new Error(`Catalog movie not found for tmdb_id ${tmdbId}`);
  }

  await getDb()
    .insert(userMovies)
    .values({
      userId,
      movieId: catalogMovie.id,
    })
    .onConflictDoNothing();

  const created = await findUserMovie(tmdbId, userId);
  if (!created) {
    throw new Error(`Failed to ensure user movie for tmdb_id ${tmdbId}`);
  }

  return created;
}

export async function getUserMovieStatusesForTmdbIds(
  userId: number,
  tmdbIds: number[],
) {
  if (tmdbIds.length === 0) {
    return new Map<
      number,
      { watchStatus: number; impression: number | null }
    >();
  }

  const rows = await getDb()
    .select({
      tmdbId: movies.tmdbId,
      watchStatus: userMovies.watchStatus,
      impression: userMovies.impression,
    })
    .from(userMovies)
    .innerJoin(movies, eq(userMovies.movieId, movies.id))
    .where(and(eq(userMovies.userId, userId), inArray(movies.tmdbId, tmdbIds)));

  return new Map(
    rows.map((row) => [
      row.tmdbId,
      { watchStatus: row.watchStatus, impression: row.impression },
    ]),
  );
}

export async function deleteUserMovie(tmdbId: number, userId: number) {
  const db = getDb();
  const row = await db
    .select({ id: userMovies.id })
    .from(userMovies)
    .innerJoin(movies, eq(userMovies.movieId, movies.id))
    .where(and(eq(movies.tmdbId, tmdbId), eq(userMovies.userId, userId)))
    .get();

  if (!row) {
    return [];
  }

  return db.delete(userMovies).where(eq(userMovies.id, row.id)).returning();
}

export async function updateUserMovieByTmdbId(
  tmdbId: number,
  userId: number,
  updateData: Partial<typeof userMovies.$inferInsert>,
) {
  const db = getDb();
  const row = await db
    .select({ id: userMovies.id })
    .from(userMovies)
    .innerJoin(movies, eq(userMovies.movieId, movies.id))
    .where(and(eq(movies.tmdbId, tmdbId), eq(userMovies.userId, userId)))
    .get();

  if (!row) {
    return null;
  }

  const updated = await db
    .update(userMovies)
    .set(updateData)
    .where(eq(userMovies.id, row.id))
    .returning({
      impression: userMovies.impression,
      watchStatus: userMovies.watchStatus,
    });

  return updated[0] ?? null;
}
