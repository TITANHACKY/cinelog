import { and, asc, eq, inArray } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  movies,
  series,
  userMovies,
  userPreferences,
  userPreferredGenres,
  userPreferredLanguages,
  userSeries,
  users,
} from "@/db/schema";
import type { UserPreferences, UserPreferencesInput } from "@/lib/types";

// Given candidate TMDB ids, return the subset already on the user's watchlist,
// split by media type, so onboarding suggestions can render the "added" state.
export async function findWatchlistedTmdbIds(
  userId: number,
  movieTmdbIds: number[],
  seriesTmdbIds: number[],
): Promise<{ movies: Set<number>; series: Set<number> }> {
  const db = getDb();

  const movieRows = movieTmdbIds.length
    ? await db
        .select({ tmdbId: movies.tmdbId })
        .from(userMovies)
        .innerJoin(movies, eq(userMovies.movieId, movies.id))
        .where(
          and(
            eq(userMovies.userId, userId),
            inArray(movies.tmdbId, movieTmdbIds),
          ),
        )
    : [];

  const seriesRows = seriesTmdbIds.length
    ? await db
        .select({ tmdbId: series.tmdbId })
        .from(userSeries)
        .innerJoin(series, eq(userSeries.seriesId, series.id))
        .where(
          and(
            eq(userSeries.userId, userId),
            inArray(series.tmdbId, seriesTmdbIds),
          ),
        )
    : [];

  return {
    movies: new Set(movieRows.map((row) => row.tmdbId)),
    series: new Set(seriesRows.map((row) => row.tmdbId)),
  };
}

export async function loadUserPreferences(
  userId: number,
): Promise<UserPreferences | null> {
  const db = getDb();
  const [prefsRows, genreRows, languageRows] = await db.batch([
    db.select().from(userPreferences).where(eq(userPreferences.userId, userId)),
    db
      .select({ genreTmdbId: userPreferredGenres.genreTmdbId })
      .from(userPreferredGenres)
      .where(eq(userPreferredGenres.userId, userId))
      // Pick order: discover uses the first genres and first language.
      .orderBy(asc(userPreferredGenres.id)),
    db
      .select({ languageCode: userPreferredLanguages.languageCode })
      .from(userPreferredLanguages)
      .where(eq(userPreferredLanguages.userId, userId))
      .orderBy(asc(userPreferredLanguages.id)),
  ]);

  const prefs = prefsRows[0];
  if (!prefs) return null;

  return {
    mediaLean: prefs.mediaLean as UserPreferences["mediaLean"],
    minRating: prefs.minRating,
    eras: prefs.eras ? (JSON.parse(prefs.eras) as string[]) : [],
    genreIds: genreRows.map((row) => row.genreTmdbId),
    languages: languageRows.map((row) => row.languageCode),
    smartCollectionsEnabled: Boolean(prefs.smartCollectionsEnabled),
    discoverRowsEnabled: Boolean(prefs.discoverRowsEnabled),
  };
}

export async function replaceUserPreferences(
  userId: number,
  input: UserPreferencesInput,
): Promise<void> {
  const db = getDb();
  const now = String(Math.floor(Date.now() / 1000));

  const statements: SqliteBatchQuery[] = [
    db
      .insert(userPreferences)
      .values({
        userId,
        mediaLean: input.mediaLean,
        minRating: input.minRating,
        eras: JSON.stringify(input.eras),
        ...(input.smartCollectionsEnabled !== undefined
          ? { smartCollectionsEnabled: input.smartCollectionsEnabled }
          : {}),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          mediaLean: input.mediaLean,
          minRating: input.minRating,
          eras: JSON.stringify(input.eras),
          ...(input.smartCollectionsEnabled !== undefined
            ? { smartCollectionsEnabled: input.smartCollectionsEnabled }
            : {}),
          updatedAt: now,
        },
      }),
    db
      .delete(userPreferredGenres)
      .where(eq(userPreferredGenres.userId, userId)),
    db
      .delete(userPreferredLanguages)
      .where(eq(userPreferredLanguages.userId, userId)),
  ];

  if (input.genreIds.length > 0) {
    statements.push(
      db
        .insert(userPreferredGenres)
        .values(input.genreIds.map((genreTmdbId) => ({ userId, genreTmdbId }))),
    );
  }
  if (input.languages.length > 0) {
    statements.push(
      db
        .insert(userPreferredLanguages)
        .values(
          input.languages.map((languageCode) => ({ userId, languageCode })),
        ),
    );
  }

  await db.batch(asBatch(statements));
}

export async function markOnboardingCompleted(
  userId: number,
  at: string,
): Promise<void> {
  await getDb()
    .update(users)
    .set({ onboardingCompletedAt: at })
    .where(eq(users.id, userId));
}

export async function getSmartCollectionsEnabled(
  userId: number,
): Promise<boolean> {
  const row = await getDb()
    .select({
      smartCollectionsEnabled: userPreferences.smartCollectionsEnabled,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .get();
  return Boolean(row?.smartCollectionsEnabled);
}

export async function setSmartCollectionsEnabled(
  userId: number,
  enabled: boolean,
): Promise<void> {
  const db = getDb();
  const now = String(Math.floor(Date.now() / 1000));
  await db
    .insert(userPreferences)
    .values({
      userId,
      smartCollectionsEnabled: enabled,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        smartCollectionsEnabled: enabled,
        updatedAt: now,
      },
    });
}

export async function getDiscoverRowsEnabled(userId: number): Promise<boolean> {
  const row = await getDb()
    .select({ discoverRowsEnabled: userPreferences.discoverRowsEnabled })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .get();
  // No preferences row yet means the default: rows on.
  return row ? Boolean(row.discoverRowsEnabled) : true;
}

export async function setDiscoverRowsEnabled(
  userId: number,
  enabled: boolean,
): Promise<void> {
  const db = getDb();
  const now = String(Math.floor(Date.now() / 1000));
  await db
    .insert(userPreferences)
    .values({ userId, discoverRowsEnabled: enabled })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { discoverRowsEnabled: enabled, updatedAt: now },
    });
}
