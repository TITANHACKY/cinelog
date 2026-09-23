import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import { genres, moviesToGenres, seriesToGenres } from "@/db/schema";

const BATCH_SIZE = 40;

export type GenreSyncRow = {
  id: number;
  tmdbId: number;
  name: string;
};

export type GenreSyncMutations = {
  inserts: Array<{ tmdbId: number; name: string }>;
  updates: Array<{ id: number; tmdbId: number; name: string }>;
  deletes: Array<{ id: number; tmdbId: number; name: string }>;
};

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

export async function findGenreNamesByTmdbIds(genreIds: number[]) {
  if (genreIds.length === 0) return [];

  return getDb()
    .select({ tmdbId: genres.tmdbId, name: genres.name })
    .from(genres)
    .where(inArray(genres.tmdbId, genreIds));
}

export async function listAllGenres() {
  return getDb()
    .select({ tmdb_id: genres.tmdbId, name: genres.name })
    .from(genres)
    .orderBy(asc(genres.name));
}

export async function loadGenreSyncSnapshot(): Promise<{
  genres: GenreSyncRow[];
  usedGenreIds: Set<number>;
}> {
  const db = getDb();
  const [genreRows, movieLinks, seriesLinks] = await Promise.all([
    db
      .select({
        id: genres.id,
        tmdbId: genres.tmdbId,
        name: genres.name,
      })
      .from(genres),
    db.select({ genreId: moviesToGenres.genreId }).from(moviesToGenres),
    db.select({ genreId: seriesToGenres.genreId }).from(seriesToGenres),
  ]);

  const usedGenreIds = new Set<number>();
  for (const row of movieLinks) {
    usedGenreIds.add(row.genreId);
  }
  for (const row of seriesLinks) {
    usedGenreIds.add(row.genreId);
  }

  return { genres: genreRows, usedGenreIds };
}

export async function applyGenreSyncMutations(
  mutations: GenreSyncMutations,
): Promise<{ written: number }> {
  const db = getDb();
  let written = 0;

  if (mutations.inserts.length > 0) {
    await db.insert(genres).values(
      mutations.inserts.map((genre) => ({
        tmdbId: genre.tmdbId,
        name: genre.name,
      })),
    );
    written += mutations.inserts.length;
  }

  const queries: SqliteBatchQuery[] = mutations.updates.map((update) =>
    db
      .update(genres)
      .set({ name: update.name })
      .where(eq(genres.id, update.id)),
  );

  if (mutations.deletes.length > 0) {
    const deleteIds = mutations.deletes.map((genre) => genre.id);
    queries.push(
      db.delete(genres).where(
        and(
          inArray(genres.id, deleteIds),
          sql`${genres.id} NOT IN (
            SELECT ${moviesToGenres.genreId} FROM ${moviesToGenres}
            UNION
            SELECT ${seriesToGenres.genreId} FROM ${seriesToGenres}
          )`,
        ),
      ),
    );
    written += mutations.deletes.length;
  }

  await runBatches(queries);
  written += mutations.updates.length;

  return { written };
}
