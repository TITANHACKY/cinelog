import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { franchises, userFranchises } from "@/db/schema";
import { nowUnixSeconds } from "@/lib/media/display";

export type UpsertFranchiseInput = {
  tmdbId: number;
  name: string;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
};

export async function findFranchiseByTmdbId(tmdbId: number) {
  return getDb()
    .select()
    .from(franchises)
    .where(eq(franchises.tmdbId, tmdbId))
    .get();
}

export async function upsertFranchise(data: UpsertFranchiseInput) {
  const db = getDb();
  const now = nowUnixSeconds();

  await db
    .insert(franchises)
    .values({
      tmdbId: data.tmdbId,
      name: data.name,
      overview: data.overview ?? null,
      posterPath: data.posterPath ?? null,
      backdropPath: data.backdropPath ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: franchises.tmdbId,
      set: {
        name: data.name,
        overview: data.overview ?? null,
        posterPath: data.posterPath ?? null,
        backdropPath: data.backdropPath ?? null,
        updatedAt: now,
      },
    });

  const franchise = await findFranchiseByTmdbId(data.tmdbId);
  if (!franchise) {
    throw new Error(`Failed to upsert franchise for tmdb_id ${data.tmdbId}`);
  }

  return franchise;
}

export async function isUserFollowingFranchise(
  userId: number,
  franchiseTmdbId: number,
): Promise<boolean> {
  const row = await getDb()
    .select({ id: userFranchises.id })
    .from(userFranchises)
    .innerJoin(franchises, eq(userFranchises.franchiseId, franchises.id))
    .where(
      and(
        eq(userFranchises.userId, userId),
        eq(franchises.tmdbId, franchiseTmdbId),
      ),
    )
    .get();

  return Boolean(row);
}

export async function insertUserFranchise(userId: number, franchiseId: number) {
  const db = getDb();
  const now = nowUnixSeconds();

  await db
    .insert(userFranchises)
    .values({
      userId,
      franchiseId,
      updatedAt: now,
    })
    .onConflictDoNothing();
}

export async function deleteUserFranchise(
  userId: number,
  franchiseTmdbId: number,
) {
  const db = getDb();
  const franchise = await findFranchiseByTmdbId(franchiseTmdbId);
  if (!franchise) return;

  await db
    .delete(userFranchises)
    .where(
      and(
        eq(userFranchises.userId, userId),
        eq(userFranchises.franchiseId, franchise.id),
      ),
    );
}

export async function getUserFollowedFranchises(userId: number) {
  return getDb()
    .select({
      id: franchises.id,
      tmdbId: franchises.tmdbId,
      name: franchises.name,
      overview: franchises.overview,
      posterPath: franchises.posterPath,
      backdropPath: franchises.backdropPath,
      followedAt: userFranchises.createdAt,
    })
    .from(userFranchises)
    .innerJoin(franchises, eq(userFranchises.franchiseId, franchises.id))
    .where(eq(userFranchises.userId, userId))
    .orderBy(desc(userFranchises.createdAt))
    .all();
}
