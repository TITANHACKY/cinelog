import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { franchises, movies, userFranchises, userMovies } from "@/db/schema";
import { WATCH_STATUS } from "@/lib/constants";
import { nowUnixSeconds } from "@/lib/media/display";

const COMPLETED_WATCH_STATUS = WATCH_STATUS[2].value;

export async function countUserCompletedFranchiseParts(
  userId: number,
  franchiseDbId: number,
): Promise<number> {
  const row = await getDb()
    .select({ value: count() })
    .from(userMovies)
    .innerJoin(movies, eq(userMovies.movieId, movies.id))
    .where(
      and(
        eq(userMovies.userId, userId),
        eq(movies.franchiseId, franchiseDbId),
        eq(userMovies.watchStatus, COMPLETED_WATCH_STATUS),
      ),
    )
    .get();

  return Number(row?.value ?? 0);
}

export async function adjustUserFranchisePartsCompleted(
  userId: number,
  franchiseDbId: number,
  delta: 1 | -1,
) {
  const db = getDb();
  const now = nowUnixSeconds();

  await db
    .update(userFranchises)
    .set({
      numberOfPartsCompleted: sql`MAX(0, ${userFranchises.numberOfPartsCompleted} + ${delta})`,
      updatedAt: now,
    })
    .where(
      and(
        eq(userFranchises.userId, userId),
        eq(userFranchises.franchiseId, franchiseDbId),
      ),
    );
}

export async function applyFranchiseWatchStatusTransition(
  userId: number,
  movieTmdbId: number,
  fromStatus: number,
  toStatus: number,
) {
  if (fromStatus === toStatus) {
    return;
  }

  const movie = await getDb()
    .select({ franchiseId: movies.franchiseId })
    .from(movies)
    .where(eq(movies.tmdbId, movieTmdbId))
    .get();

  if (!movie?.franchiseId) {
    return;
  }

  const following = await getDb()
    .select({ id: userFranchises.id })
    .from(userFranchises)
    .where(
      and(
        eq(userFranchises.userId, userId),
        eq(userFranchises.franchiseId, movie.franchiseId),
      ),
    )
    .get();

  if (!following) {
    return;
  }

  if (
    fromStatus !== COMPLETED_WATCH_STATUS &&
    toStatus === COMPLETED_WATCH_STATUS
  ) {
    await adjustUserFranchisePartsCompleted(userId, movie.franchiseId, 1);
    return;
  }

  if (
    fromStatus === COMPLETED_WATCH_STATUS &&
    toStatus !== COMPLETED_WATCH_STATUS
  ) {
    await adjustUserFranchisePartsCompleted(userId, movie.franchiseId, -1);
  }
}

export async function backfillUserFranchisePartsCompleted(
  userId: number,
  franchiseDbId: number,
) {
  const completed = await countUserCompletedFranchiseParts(
    userId,
    franchiseDbId,
  );
  const now = nowUnixSeconds();

  await getDb()
    .update(userFranchises)
    .set({
      numberOfPartsCompleted: completed,
      updatedAt: now,
    })
    .where(
      and(
        eq(userFranchises.userId, userId),
        eq(userFranchises.franchiseId, franchiseDbId),
      ),
    );

  return completed;
}

export async function countUserFranchiseFollowRows() {
  const row = await getDb()
    .select({ value: count() })
    .from(userFranchises)
    .get();

  return Number(row?.value ?? 0);
}

export async function backfillAllUserFranchisePartsCompleted() {
  const rows = await getDb()
    .select({
      userId: userFranchises.userId,
      franchiseId: userFranchises.franchiseId,
    })
    .from(userFranchises);

  let updated = 0;
  for (const row of rows) {
    await backfillUserFranchisePartsCompleted(row.userId, row.franchiseId);
    updated += 1;
  }

  return updated;
}

export async function findUserFranchiseProgress(
  userId: number,
  franchiseDbId: number,
) {
  return getDb()
    .select({
      numberOfPartsCompleted: userFranchises.numberOfPartsCompleted,
      numberOfParts: franchises.numberOfParts,
    })
    .from(userFranchises)
    .innerJoin(franchises, eq(userFranchises.franchiseId, franchises.id))
    .where(
      and(
        eq(userFranchises.userId, userId),
        eq(userFranchises.franchiseId, franchiseDbId),
      ),
    )
    .get();
}
