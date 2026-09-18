import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { movies, userMovies } from "@/db/schema";
import type { MoviePayload } from "@/lib/types";
import {
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

export async function updateUserMovie(
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
    return [];
  }

  return db
    .update(userMovies)
    .set(updateData)
    .where(eq(userMovies.id, row.id))
    .returning();
}
