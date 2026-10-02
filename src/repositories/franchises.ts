import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import { asBatch, getDb } from "@/db";
import { franchises, movies, userFranchises } from "@/db/schema";
import { nowUnixSeconds } from "@/lib/media/display";

export type UpsertFranchiseInput = {
  tmdbId: number;
  name: string;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  numberOfParts?: number;
};

export async function findFranchiseByTmdbId(tmdbId: number) {
  return getDb()
    .select()
    .from(franchises)
    .where(eq(franchises.tmdbId, tmdbId))
    .get();
}

export async function findFranchiseForMovieTmdbId(tmdbId: number) {
  return getDb()
    .select({
      id: franchises.id,
      tmdbId: franchises.tmdbId,
      name: franchises.name,
      overview: franchises.overview,
      posterPath: franchises.posterPath,
      backdropPath: franchises.backdropPath,
    })
    .from(movies)
    .innerJoin(franchises, eq(movies.franchiseId, franchises.id))
    .where(eq(movies.tmdbId, tmdbId))
    .get();
}

export async function findFranchiseMovies(franchiseDbId: number) {
  return getDb()
    .select({
      id: movies.id,
      tmdbId: movies.tmdbId,
      title: movies.title,
      posterPath: movies.posterPath,
      releaseDate: movies.releaseDate,
      voteAverage: movies.voteAverage,
      originalLanguage: movies.originalLanguage,
    })
    .from(movies)
    .where(eq(movies.franchiseId, franchiseDbId))
    .orderBy(asc(movies.releaseDate), asc(movies.id));
}

export async function listAllFranchises() {
  return getDb().select().from(franchises).orderBy(asc(franchises.name));
}

export async function listMoviesByFranchiseIds(franchiseDbIds: number[]) {
  if (franchiseDbIds.length === 0) {
    return [];
  }

  return getDb()
    .select({
      id: movies.id,
      tmdbId: movies.tmdbId,
      franchiseId: movies.franchiseId,
    })
    .from(movies)
    .where(inArray(movies.franchiseId, franchiseDbIds));
}

export async function upsertFranchise(data: UpsertFranchiseInput) {
  const db = getDb();
  const now = nowUnixSeconds();

  const numberOfParts = data.numberOfParts ?? 0;

  await db
    .insert(franchises)
    .values({
      tmdbId: data.tmdbId,
      name: data.name,
      overview: data.overview ?? null,
      posterPath: data.posterPath ?? null,
      backdropPath: data.backdropPath ?? null,
      numberOfParts,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: franchises.tmdbId,
      set: {
        name: data.name,
        overview: data.overview ?? null,
        posterPath: data.posterPath ?? null,
        backdropPath: data.backdropPath ?? null,
        ...(data.numberOfParts !== undefined
          ? { numberOfParts: data.numberOfParts }
          : {}),
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

export async function insertUserFranchise(
  userId: number,
  franchiseId: number,
  numberOfPartsCompleted = 0,
) {
  const db = getDb();
  const now = nowUnixSeconds();

  await db
    .insert(userFranchises)
    .values({
      userId,
      franchiseId,
      numberOfPartsCompleted,
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

export type FranchiseSortBy = "name" | "followedAt";
export type FranchiseSortOrder = "asc" | "desc";

export type FollowedFranchiseRow = {
  id: number;
  tmdbId: number;
  name: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  numberOfParts: number;
  numberOfPartsCompleted: number;
  followedAt: string | null;
};

export type GetUserFollowedFranchisesOptions = {
  limit?: number;
  offset?: number;
  q?: string;
  sortBy?: FranchiseSortBy;
  sortOrder?: FranchiseSortOrder;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function likeContains(column: SQLWrapper, value: string) {
  const pattern = `%${escapeLike(value.toLowerCase())}%`;
  return sql`lower(${column}) LIKE ${pattern} ESCAPE '\\'`;
}

export async function getUserFollowedFranchises(
  userId: number,
  options?: GetUserFollowedFranchisesOptions,
): Promise<{
  franchises: FollowedFranchiseRow[];
  totalCount: number;
  hasMore: boolean;
}> {
  const db = getDb();

  const conditions = [eq(userFranchises.userId, userId)];
  const trimmedQ = options?.q?.trim();
  if (trimmedQ) {
    conditions.push(likeContains(franchises.name, trimmedQ));
  }
  const whereClause = and(...conditions);

  const countQuery = db
    .select({ value: count() })
    .from(userFranchises)
    .innerJoin(franchises, eq(userFranchises.franchiseId, franchises.id))
    .where(whereClause);

  const sortBy = options?.sortBy ?? "name";
  const sortOrder = options?.sortOrder ?? "asc";

  const primaryOrder =
    sortBy === "name"
      ? sortOrder === "desc"
        ? desc(franchises.name)
        : asc(franchises.name)
      : sortOrder === "asc"
        ? asc(userFranchises.createdAt)
        : desc(userFranchises.createdAt);

  const itemsSelect = db
    .select({
      id: franchises.id,
      tmdbId: franchises.tmdbId,
      name: franchises.name,
      overview: franchises.overview,
      posterPath: franchises.posterPath,
      backdropPath: franchises.backdropPath,
      numberOfParts: franchises.numberOfParts,
      numberOfPartsCompleted: userFranchises.numberOfPartsCompleted,
      followedAt: userFranchises.createdAt,
    })
    .from(userFranchises)
    .innerJoin(franchises, eq(userFranchises.franchiseId, franchises.id))
    .where(whereClause)
    .orderBy(primaryOrder, desc(userFranchises.id));

  const itemsQuery =
    options?.limit !== undefined
      ? itemsSelect.limit(options.limit).offset(options.offset ?? 0)
      : itemsSelect;

  const [countResult, items] = await db.batch(
    asBatch([countQuery, itemsQuery]),
  );

  const totalCount = Number(countResult[0]?.value ?? 0);
  const franchisesList = (items ?? []) as FollowedFranchiseRow[];
  const offset = options?.offset ?? 0;
  const hasMore = offset + franchisesList.length < totalCount;

  return {
    franchises: franchisesList,
    totalCount,
    hasMore,
  };
}
