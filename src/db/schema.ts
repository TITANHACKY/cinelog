import {
  check,
  integer,
  index,
  numeric,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { MOVIE_STATUS, SERIES_STATUS } from "@/lib/constants";

const movieStatusValues = sql.raw(
  Object.values(MOVIE_STATUS)
    .map((status) => `'${status.value}'`)
    .join(", "),
);
const seriesStatusValues = sql.raw(
  Object.values(SERIES_STATUS)
    .map((status) => `'${status.value}'`)
    .join(", "),
);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: numeric("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: numeric("updated_at"),
  onboardingCompletedAt: numeric("onboarding_completed_at"),
});

export const genres = sqliteTable("genres", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdbId: integer("tmdb_id").notNull().unique(),
  name: text("name").notNull(),
  createdAt: numeric("created_at").default(sql`(unixepoch())`),
});

export const movies = sqliteTable(
  "movies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tmdbId: integer("tmdb_id").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    releaseDate: text("release_date"),
    voteAverage: real("vote_average"),
    status: text("status"),
    originalLanguage: text("original_language"),
    originCountry: text("origin_country"),
    certificate: text("certificate"),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
  },
  (table) => [
    check(
      "movies_status_check",
      sql`${table.status} IS NULL OR ${table.status} IN (${movieStatusValues})`,
    ),
    check(
      "movies_vote_average_check",
      sql`${table.voteAverage} IS NULL OR (${table.voteAverage} >= 0 AND ${table.voteAverage} <= 10)`,
    ),
    uniqueIndex("movies_tmdb_id_unique").on(table.tmdbId),
    index("movies_status_index").on(table.status),
  ],
);

export const userMovies = sqliteTable(
  "user_movies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "restrict" }),
    watchStatus: integer("watch_status").notNull().default(0),
    impression: integer("impression"),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
    completedAt: numeric("completed_at"),
  },
  (table) => [
    check(
      "user_movies_watch_status_check",
      sql`${table.watchStatus} IN (0, 1, 2, 3)`,
    ),
    check(
      "user_movies_impression_check",
      sql`${table.impression} IS NULL OR ${table.impression} IN (0, 1, 2)`,
    ),
    uniqueIndex("user_movies_user_id_movie_id_unique").on(
      table.userId,
      table.movieId,
    ),
    index("user_movies_user_id_index").on(table.userId),
    index("user_movies_user_id_created_at_index").on(
      table.userId,
      table.createdAt,
    ),
    index("user_movies_user_id_watch_status_index").on(
      table.userId,
      table.watchStatus,
    ),
    index("user_movies_user_id_impression_index").on(
      table.userId,
      table.impression,
    ),
    index("user_movies_user_id_completed_at_index").on(
      table.userId,
      table.completedAt,
    ),
  ],
);

export const moviesToGenres = sqliteTable(
  "movies_to_genres",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: integer("genres_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("movies_to_genres_movie_genre_unique").on(
      table.movieId,
      table.genreId,
    ),
  ],
);

export const series = sqliteTable(
  "series",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tmdbId: integer("tmdb_id").notNull(),
    name: text("name").notNull(),
    posterPath: text("poster_path"),
    firstAirDate: text("first_air_date"),
    lastAirDate: text("last_air_date"),
    totalNumberOfEpisodes: integer("total_number_of_episodes"),
    totalNumberOfSeasons: integer("total_number_of_seasons"),
    voteAverage: real("vote_average"),
    status: text("status"),
    originalLanguage: text("original_language"),
    originCountry: text("origin_country"),
    certificate: text("certificate"),
    type: text("type"),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
  },
  (table) => [
    check(
      "series_status_check",
      sql`${table.status} IS NULL OR ${table.status} IN (${seriesStatusValues})`,
    ),
    check(
      "series_total_episodes_check",
      sql`${table.totalNumberOfEpisodes} IS NULL OR ${table.totalNumberOfEpisodes} >= 0`,
    ),
    check(
      "series_total_seasons_check",
      sql`${table.totalNumberOfSeasons} IS NULL OR ${table.totalNumberOfSeasons} >= 0`,
    ),
    check(
      "series_vote_average_check",
      sql`${table.voteAverage} IS NULL OR (${table.voteAverage} >= 0 AND ${table.voteAverage} <= 10)`,
    ),
    uniqueIndex("series_tmdb_id_unique").on(table.tmdbId),
    index("series_status_index").on(table.status),
  ],
);

export const userSeries = sqliteTable(
  "user_series",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "restrict" }),
    watchStatus: integer("watch_status").notNull().default(0),
    impression: integer("impression"),
    lastWatchedAt: numeric("last_watched_at"),
    completedAt: numeric("completed_at"),
    totalNumberOfEpisodesWatched: integer("total_number_of_episodes_watched")
      .notNull()
      .default(0),
    totalNumberOfSeasonsWatched: integer("total_number_of_seasons_watched")
      .notNull()
      .default(0),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
  },
  (table) => [
    check(
      "user_series_watch_status_check",
      sql`${table.watchStatus} IN (0, 1, 2, 3)`,
    ),
    check(
      "user_series_impression_check",
      sql`${table.impression} IS NULL OR ${table.impression} IN (0, 1, 2)`,
    ),
    check(
      "user_series_total_episodes_watched_check",
      sql`${table.totalNumberOfEpisodesWatched} >= 0`,
    ),
    check(
      "user_series_total_seasons_watched_check",
      sql`${table.totalNumberOfSeasonsWatched} >= 0`,
    ),
    uniqueIndex("user_series_user_id_series_id_unique").on(
      table.userId,
      table.seriesId,
    ),
    index("user_series_user_id_index").on(table.userId),
    index("user_series_user_id_created_at_index").on(
      table.userId,
      table.createdAt,
    ),
    index("user_series_user_id_watch_status_index").on(
      table.userId,
      table.watchStatus,
    ),
    index("user_series_user_id_impression_index").on(
      table.userId,
      table.impression,
    ),
    index("user_series_user_id_completed_at_index").on(
      table.userId,
      table.completedAt,
    ),
    index("user_series_user_id_last_watched_at_index").on(
      table.userId,
      table.lastWatchedAt,
    ),
  ],
);

export const seasons = sqliteTable(
  "seasons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tmdbId: integer("tmdb_id").notNull(),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    name: text("name"),
    seasonNumber: integer("season_number").notNull(),
    episodeCount: integer("episode_count").notNull(),
    airDate: text("air_date"),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
  },
  (table) => [
    check("seasons_season_number_check", sql`${table.seasonNumber} >= 0`),
    check("seasons_episode_count_check", sql`${table.episodeCount} >= 0`),
    index("seasons_catalog_tmdb_id_index").on(table.tmdbId),
    index("seasons_catalog_series_id_index").on(table.seriesId),
    uniqueIndex("seasons_series_season_number_unique").on(
      table.seriesId,
      table.seasonNumber,
    ),
  ],
);

export const userSeasonProgress = sqliteTable(
  "user_season_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userSeriesId: integer("user_series_id")
      .notNull()
      .references(() => userSeries.id, { onDelete: "cascade" }),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    episodesWatched: integer("episodes_watched").notNull().default(0),
    lastWatchedAt: numeric("last_watched_at"),
    completedAt: numeric("completed_at"),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
  },
  (table) => [
    check(
      "user_season_progress_episodes_watched_check",
      sql`${table.episodesWatched} >= 0`,
    ),
    uniqueIndex("user_season_progress_user_series_season_unique").on(
      table.userSeriesId,
      table.seasonId,
    ),
    index("user_season_progress_user_series_id_index").on(table.userSeriesId),
  ],
);

export const seriesToGenres = sqliteTable(
  "series_to_genres",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    genreId: integer("genres_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("series_to_genres_series_genre_unique").on(
      table.seriesId,
      table.genreId,
    ),
  ],
);

export const customCollections = sqliteTable(
  "custom_collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mediaType: integer("media_type").notNull(),
    showInDashboard: integer("show_in_dashboard", { mode: "boolean" })
      .notNull()
      .default(false),
    showInLibrary: integer("show_in_library", { mode: "boolean" })
      .notNull()
      .default(false),
    groupBy: integer("group_by"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
  },
  (table) => [
    check(
      "custom_collections_group_by_check",
      sql`${table.groupBy} IS NULL OR (${table.showInDashboard} = 0 AND ${table.showInLibrary} = 1)`,
    ),
    check(
      "custom_collections_group_by_values_check",
      sql`${table.groupBy} IS NULL OR ${table.groupBy} IN (0, 1, 2)`,
    ),
    check(
      "custom_collections_media_type_check",
      sql`${table.mediaType} IN (0, 1)`,
    ),
    check(
      "custom_collections_name_length_check",
      sql`length(${table.name}) <= 100`,
    ),
    index("custom_collections_user_id_index").on(table.userId),
  ],
);

export const customCollectionFilters = sqliteTable(
  "custom_collection_filters",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customCollectionId: integer("custom_collection_id")
      .notNull()
      .references(() => customCollections.id, { onDelete: "cascade" }),
    field: text("field").notNull(),
    operator: integer("operator").notNull(),
    value: text("value").notNull(),
  },
  (table) => [
    check(
      "custom_collection_filters_operator_check",
      sql`${table.operator} BETWEEN 0 AND 5`,
    ),
    index("custom_collection_filters_collection_id_index").on(
      table.customCollectionId,
    ),
  ],
);

export const customCollectionSorts = sqliteTable(
  "custom_collection_sorts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customCollectionId: integer("custom_collection_id")
      .notNull()
      .references(() => customCollections.id, { onDelete: "cascade" }),
    field: text("field").notNull(),
    direction: integer("direction").notNull(),
    priority: integer("priority").notNull(),
  },
  (table) => [
    check(
      "custom_collection_sorts_direction_check",
      sql`${table.direction} IN (0, 1)`,
    ),
    index("custom_collection_sorts_collection_id_index").on(
      table.customCollectionId,
    ),
  ],
);

export const userPreferences = sqliteTable(
  "user_preferences",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaLean: integer("media_lean").notNull().default(2),
    minRating: real("min_rating"),
    eras: text("eras"), // JSON array of era bucket values
    createdAt: numeric("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: numeric("updated_at"),
  },
  (table) => [
    check(
      "user_preferences_media_lean_check",
      sql`${table.mediaLean} IN (0, 1, 2)`,
    ),
    check(
      "user_preferences_min_rating_check",
      sql`${table.minRating} IS NULL OR (${table.minRating} >= 0 AND ${table.minRating} <= 10)`,
    ),
    uniqueIndex("user_preferences_user_id_unique").on(table.userId),
  ],
);

export const userPreferredGenres = sqliteTable(
  "user_preferred_genres",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    genreTmdbId: integer("genre_tmdb_id").notNull(),
  },
  (table) => [
    uniqueIndex("user_preferred_genres_user_genre_unique").on(
      table.userId,
      table.genreTmdbId,
    ),
    index("user_preferred_genres_user_id_index").on(table.userId),
  ],
);

export const userPreferredLanguages = sqliteTable(
  "user_preferred_languages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageCode: text("language_code").notNull(),
  },
  (table) => [
    uniqueIndex("user_preferred_languages_user_lang_unique").on(
      table.userId,
      table.languageCode,
    ),
    index("user_preferred_languages_user_id_index").on(table.userId),
  ],
);

export const userSeedTitles = sqliteTable(
  "user_seed_titles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: integer("media_type").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
  },
  (table) => [
    check(
      "user_seed_titles_media_type_check",
      sql`${table.mediaType} IN (0, 1)`,
    ),
    uniqueIndex("user_seed_titles_user_tmdb_media_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType,
    ),
    index("user_seed_titles_user_id_index").on(table.userId),
  ],
);

export type Genre = typeof genres.$inferSelect;
export type NewGenre = typeof genres.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
export type UserMovie = typeof userMovies.$inferSelect;
export type NewUserMovie = typeof userMovies.$inferInsert;
export type MovieToGenre = typeof moviesToGenres.$inferSelect;
export type NewMovieToGenre = typeof moviesToGenres.$inferInsert;
export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
export type UserSeries = typeof userSeries.$inferSelect;
export type NewUserSeries = typeof userSeries.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type UserSeasonProgress = typeof userSeasonProgress.$inferSelect;
export type NewUserSeasonProgress = typeof userSeasonProgress.$inferInsert;
export type SeriesToGenre = typeof seriesToGenres.$inferSelect;
export type NewSeriesToGenre = typeof seriesToGenres.$inferInsert;
export type CustomCollection = typeof customCollections.$inferSelect;
export type NewCustomCollection = typeof customCollections.$inferInsert;
export type CustomCollectionFilter =
  typeof customCollectionFilters.$inferSelect;
export type NewCustomCollectionFilter =
  typeof customCollectionFilters.$inferInsert;
export type CustomCollectionSort = typeof customCollectionSorts.$inferSelect;
export type NewCustomCollectionSort = typeof customCollectionSorts.$inferInsert;
export type UserPreferencesRow = typeof userPreferences.$inferSelect;
export type NewUserPreferencesRow = typeof userPreferences.$inferInsert;
export type UserPreferredGenre = typeof userPreferredGenres.$inferSelect;
export type NewUserPreferredGenre = typeof userPreferredGenres.$inferInsert;
export type UserPreferredLanguage = typeof userPreferredLanguages.$inferSelect;
export type NewUserPreferredLanguage =
  typeof userPreferredLanguages.$inferInsert;
export type UserSeedTitle = typeof userSeedTitles.$inferSelect;
export type NewUserSeedTitle = typeof userSeedTitles.$inferInsert;
