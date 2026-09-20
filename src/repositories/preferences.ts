import { eq } from "drizzle-orm";
import { asBatch, getDb, type SqliteBatchQuery } from "@/db";
import {
  userPreferences,
  userPreferredGenres,
  userPreferredLanguages,
  userSeedTitles,
  users,
} from "@/db/schema";
import type { UserPreferences, UserPreferencesInput } from "@/lib/types";

export async function loadUserPreferences(
  userId: number,
): Promise<UserPreferences | null> {
  const db = getDb();
  const [prefsRows, genreRows, languageRows, seedRows] = await db.batch([
    db.select().from(userPreferences).where(eq(userPreferences.userId, userId)),
    db
      .select({ genreTmdbId: userPreferredGenres.genreTmdbId })
      .from(userPreferredGenres)
      .where(eq(userPreferredGenres.userId, userId)),
    db
      .select({ languageCode: userPreferredLanguages.languageCode })
      .from(userPreferredLanguages)
      .where(eq(userPreferredLanguages.userId, userId)),
    db
      .select({
        tmdbId: userSeedTitles.tmdbId,
        mediaType: userSeedTitles.mediaType,
        title: userSeedTitles.title,
        posterPath: userSeedTitles.posterPath,
      })
      .from(userSeedTitles)
      .where(eq(userSeedTitles.userId, userId)),
  ]);

  const prefs = prefsRows[0];
  if (!prefs) return null;

  return {
    mediaLean: prefs.mediaLean as UserPreferences["mediaLean"],
    minRating: prefs.minRating,
    eras: prefs.eras ? (JSON.parse(prefs.eras) as string[]) : [],
    genreIds: genreRows.map((row) => row.genreTmdbId),
    languages: languageRows.map((row) => row.languageCode),
    seedTitles: seedRows.map((row) => ({
      tmdbId: row.tmdbId,
      mediaType: row.mediaType as 0 | 1,
      title: row.title,
      posterPath: row.posterPath,
    })),
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
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          mediaLean: input.mediaLean,
          minRating: input.minRating,
          eras: JSON.stringify(input.eras),
          updatedAt: now,
        },
      }),
    db.delete(userPreferredGenres).where(eq(userPreferredGenres.userId, userId)),
    db
      .delete(userPreferredLanguages)
      .where(eq(userPreferredLanguages.userId, userId)),
    db.delete(userSeedTitles).where(eq(userSeedTitles.userId, userId)),
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
        .values(input.languages.map((languageCode) => ({ userId, languageCode }))),
    );
  }
  if (input.seedTitles.length > 0) {
    statements.push(
      db.insert(userSeedTitles).values(
        input.seedTitles.map((seed) => ({
          userId,
          tmdbId: seed.tmdbId,
          mediaType: seed.mediaType,
          title: seed.title,
          posterPath: seed.posterPath,
        })),
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
