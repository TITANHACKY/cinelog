import { and, eq, sql } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  seasons,
  series,
  userSeasonProgress,
  userSeries,
} from "@/db/schema";
import type { NewUserSeries, Season, UserSeasonProgress, UserSeries } from "@/db/schema";
import type { TmdbSeries } from "@/lib/types";
import {
  listCatalogSeasons,
  upsertCatalogSeriesWithGenresAndSeasons,
} from "@/repositories/catalog";

export type UserSeriesWithCatalog = UserSeries & {
  status: string | null;
  totalNumberOfEpisodes: number | null;
  totalNumberOfSeasons: number | null;
};

export type UserSeasonWithCatalog = {
  progressId: number | null;
  seasonId: number;
  seasonNumber: number;
  episodeCount: number;
  airDate: string | null;
  episodesWatched: number;
  lastWatchedAt: string | null;
  completedAt: string | null;
};

export async function findUserSeriesAndSeasons(
  tmdbId: number,
  userId: number,
): Promise<{
  userSeries?: UserSeriesWithCatalog;
  userSeasons: UserSeasonWithCatalog[];
}> {
  const db = getDb();
  const userSeriesRow = await db
    .select({
      id: userSeries.id,
      userId: userSeries.userId,
      seriesId: userSeries.seriesId,
      watchStatus: userSeries.watchStatus,
      impression: userSeries.impression,
      lastWatchedAt: userSeries.lastWatchedAt,
      completedAt: userSeries.completedAt,
      totalNumberOfEpisodesWatched: userSeries.totalNumberOfEpisodesWatched,
      totalNumberOfSeasonsWatched: userSeries.totalNumberOfSeasonsWatched,
      createdAt: userSeries.createdAt,
      updatedAt: userSeries.updatedAt,
      status: series.status,
      totalNumberOfEpisodes: series.totalNumberOfEpisodes,
      totalNumberOfSeasons: series.totalNumberOfSeasons,
    })
    .from(userSeries)
    .innerJoin(series, eq(userSeries.seriesId, series.id))
    .where(and(eq(series.tmdbId, tmdbId), eq(userSeries.userId, userId)))
    .get();

  if (!userSeriesRow) {
    return { userSeries: undefined, userSeasons: [] };
  }

  const seasonRows = await db
    .select({
      progressId: userSeasonProgress.id,
      seasonId: seasons.id,
      seasonNumber: seasons.seasonNumber,
      episodeCount: seasons.episodeCount,
      airDate: seasons.airDate,
      episodesWatched: userSeasonProgress.episodesWatched,
      lastWatchedAt: userSeasonProgress.lastWatchedAt,
      completedAt: userSeasonProgress.completedAt,
    })
    .from(seasons)
    .leftJoin(
      userSeasonProgress,
      and(
        eq(userSeasonProgress.seasonId, seasons.id),
        eq(userSeasonProgress.userSeriesId, userSeriesRow.id),
      ),
    )
    .where(eq(seasons.seriesId, userSeriesRow.seriesId))
    .orderBy(seasons.seasonNumber);

  return {
    userSeries: userSeriesRow,
    userSeasons: seasonRows.map((row) => ({
      progressId: row.progressId ?? null,
      seasonId: row.seasonId,
      seasonNumber: row.seasonNumber,
      episodeCount: row.episodeCount,
      airDate: row.airDate,
      episodesWatched: row.episodesWatched ?? 0,
      lastWatchedAt: row.lastWatchedAt,
      completedAt: row.completedAt,
    })),
  };
}

export async function ensureUserSeasonProgress(
  userSeriesId: number,
  seasonId: number,
) {
  const db = getDb();
  const existing = await db
    .select({ id: userSeasonProgress.id })
    .from(userSeasonProgress)
    .where(
      and(
        eq(userSeasonProgress.userSeriesId, userSeriesId),
        eq(userSeasonProgress.seasonId, seasonId),
      ),
    )
    .get();

  if (existing) {
    return existing.id;
  }

  const inserted = await db
    .insert(userSeasonProgress)
    .values({
      userSeriesId,
      seasonId,
      episodesWatched: 0,
    })
    .returning({ id: userSeasonProgress.id });

  const progressId = inserted[0]?.id;
  if (!progressId) {
    throw new Error("Failed to create season progress");
  }

  return progressId;
}

export async function ensureAllUserSeasonProgress(
  userSeriesId: number,
  catalogSeriesId: number,
) {
  const catalogSeasons = await listCatalogSeasons(catalogSeriesId);
  const db = getDb();
  const existing = await db
    .select({ seasonId: userSeasonProgress.seasonId })
    .from(userSeasonProgress)
    .where(eq(userSeasonProgress.userSeriesId, userSeriesId));

  const existingIds = new Set(existing.map((row) => row.seasonId));
  const missing = catalogSeasons.filter((season) => !existingIds.has(season.id));

  if (missing.length === 0) {
    return;
  }

  await db.insert(userSeasonProgress).values(
    missing.map((season) => ({
      userSeriesId,
      seasonId: season.id,
      episodesWatched: 0,
    })),
  );
}

export async function applySeriesWatchUpdates(input: {
  userSeriesId: number;
  catalogSeriesId: number;
  seriesValues: Partial<NewUserSeries>;
  seasonUpdate?: {
    progressId: number;
    values: Partial<typeof userSeasonProgress.$inferInsert>;
  };
  resetAllSeasons?: Partial<typeof userSeasonProgress.$inferInsert>;
  completeAllSeasonsAt?: string;
}): Promise<UserSeriesWithCatalog> {
  const db = getDb();
  const queries: SqliteBatchQuery[] = [];

  if (input.seasonUpdate) {
    queries.push(
      db
        .update(userSeasonProgress)
        .set(input.seasonUpdate.values)
        .where(eq(userSeasonProgress.id, input.seasonUpdate.progressId)),
    );
  }

  if (input.resetAllSeasons) {
    queries.push(
      db
        .update(userSeasonProgress)
        .set(input.resetAllSeasons)
        .where(eq(userSeasonProgress.userSeriesId, input.userSeriesId)),
    );
  }

  if (input.completeAllSeasonsAt) {
    const completedAt = input.completeAllSeasonsAt;
    queries.push(
      db
        .update(userSeasonProgress)
        .set({
          episodesWatched: sql`(select ${seasons.episodeCount} from ${seasons} where ${seasons.id} = ${userSeasonProgress.seasonId})`,
          completedAt,
          lastWatchedAt: completedAt,
          updatedAt: completedAt,
        })
        .where(eq(userSeasonProgress.userSeriesId, input.userSeriesId)),
    );
  }

  queries.push(
    db
      .update(userSeries)
      .set(input.seriesValues)
      .where(eq(userSeries.id, input.userSeriesId))
      .returning(),
  );

  const results = await db.batch(asBatch(queries));
  const updatedUserSeries = results[results.length - 1] as UserSeries[];
  const userSeriesRow = updatedUserSeries[0];
  if (!userSeriesRow) {
    throw new Error("Failed to update user series");
  }

  const catalogRow = await db
    .select({
      status: series.status,
      totalNumberOfEpisodes: series.totalNumberOfEpisodes,
      totalNumberOfSeasons: series.totalNumberOfSeasons,
    })
    .from(series)
    .where(eq(series.id, input.catalogSeriesId))
    .get();

  return {
    ...userSeriesRow,
    status: catalogRow?.status ?? null,
    totalNumberOfEpisodes: catalogRow?.totalNumberOfEpisodes ?? null,
    totalNumberOfSeasons: catalogRow?.totalNumberOfSeasons ?? null,
  };
}

export async function insertUserSeries(
  tmdbId: number,
  userId: number,
  body: TmdbSeries,
) {
  const catalogSeries = await upsertCatalogSeriesWithGenresAndSeasons(
    tmdbId,
    body,
  );
  const catalogSeasons = await listCatalogSeasons(catalogSeries.id);

  const db = getDb();
  const inserted = await db
    .insert(userSeries)
    .values({
      userId,
      seriesId: catalogSeries.id,
    })
    .returning();

  const userSeriesRow = inserted[0];
  if (!userSeriesRow) {
    throw new Error("Failed to insert user series");
  }

  if (catalogSeasons.length > 0) {
    await db.insert(userSeasonProgress).values(
      catalogSeasons.map((season) => ({
        userSeriesId: userSeriesRow.id,
        seasonId: season.id,
        episodesWatched: 0,
      })),
    );
  }
}

export async function deleteUserSeries(tmdbId: number, userId: number) {
  const db = getDb();
  const row = await db
    .select({ id: userSeries.id })
    .from(userSeries)
    .innerJoin(series, eq(userSeries.seriesId, series.id))
    .where(and(eq(series.tmdbId, tmdbId), eq(userSeries.userId, userId)))
    .get();

  if (!row) {
    return [];
  }

  return db.delete(userSeries).where(eq(userSeries.id, row.id)).returning();
}

export type { Season, UserSeasonProgress, UserSeries };
