import { asc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { genres } from "@/db/schema";

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
