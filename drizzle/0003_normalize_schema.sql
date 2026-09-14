CREATE TABLE IF NOT EXISTS `movies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`title` text NOT NULL,
	`poster_path` text,
	`release_date` text,
	`vote_average` real,
	`status` text,
	`original_language` text,
	`origin_country` text,
	`certificate` text,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	CONSTRAINT "movies_status_check" CHECK("movies"."status" IS NULL OR "movies"."status" IN ('rumored', 'planned', 'in_production', 'post_production', 'released', 'canceled')),
	CONSTRAINT "movies_vote_average_check" CHECK("movies"."vote_average" IS NULL OR ("movies"."vote_average" >= 0 AND "movies"."vote_average" <= 10))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `movies_tmdb_id_unique` ON `movies` (`tmdb_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `movies_status_index` ON `movies` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_movies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`movie_id` integer NOT NULL,
	`watch_status` integer DEFAULT 0 NOT NULL,
	`impression` integer,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	`completed_at` numeric,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "user_movies_watch_status_check" CHECK("user_movies"."watch_status" IN (0, 1, 2, 3)),
	CONSTRAINT "user_movies_impression_check" CHECK("user_movies"."impression" IS NULL OR "user_movies"."impression" IN (0, 1, 2))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_movies_user_id_movie_id_unique` ON `user_movies` (`user_id`,`movie_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_movies_user_id_index` ON `user_movies` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_movies_user_id_created_at_index` ON `user_movies` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`name` text NOT NULL,
	`poster_path` text,
	`first_air_date` text,
	`last_air_date` text,
	`total_number_of_episodes` integer,
	`total_number_of_seasons` integer,
	`vote_average` real,
	`status` text,
	`original_language` text,
	`origin_country` text,
	`certificate` text,
	`type` text,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	CONSTRAINT "series_status_check" CHECK("series"."status" IS NULL OR "series"."status" IN ('returning_series', 'planned', 'in_production', 'ended', 'canceled', 'pilot')),
	CONSTRAINT "series_total_episodes_check" CHECK("series"."total_number_of_episodes" IS NULL OR "series"."total_number_of_episodes" >= 0),
	CONSTRAINT "series_total_seasons_check" CHECK("series"."total_number_of_seasons" IS NULL OR "series"."total_number_of_seasons" >= 0),
	CONSTRAINT "series_vote_average_check" CHECK("series"."vote_average" IS NULL OR ("series"."vote_average" >= 0 AND "series"."vote_average" <= 10))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `series_tmdb_id_unique` ON `series` (`tmdb_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `series_status_index` ON `series` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`series_id` integer NOT NULL,
	`watch_status` integer DEFAULT 0 NOT NULL,
	`impression` integer,
	`last_watched_at` numeric,
	`completed_at` numeric,
	`total_number_of_episodes_watched` integer DEFAULT 0 NOT NULL,
	`total_number_of_seasons_watched` integer DEFAULT 0 NOT NULL,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "user_series_watch_status_check" CHECK("user_series"."watch_status" IN (0, 1, 2, 3)),
	CONSTRAINT "user_series_impression_check" CHECK("user_series"."impression" IS NULL OR "user_series"."impression" IN (0, 1, 2)),
	CONSTRAINT "user_series_total_episodes_watched_check" CHECK("user_series"."total_number_of_episodes_watched" >= 0),
	CONSTRAINT "user_series_total_seasons_watched_check" CHECK("user_series"."total_number_of_seasons_watched" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_series_user_id_series_id_unique` ON `user_series` (`user_id`,`series_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_series_user_id_index` ON `user_series` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_series_user_id_created_at_index` ON `user_series` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `seasons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`series_id` integer NOT NULL,
	`name` text,
	`season_number` integer NOT NULL,
	`episode_count` integer NOT NULL,
	`air_date` text,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "seasons_season_number_check" CHECK("seasons"."season_number" >= 0),
	CONSTRAINT "seasons_episode_count_check" CHECK("seasons"."episode_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `seasons_catalog_tmdb_id_index` ON `seasons` (`tmdb_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `seasons_catalog_series_id_index` ON `seasons` (`series_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `seasons_series_season_number_unique` ON `seasons` (`series_id`,`season_number`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_season_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_series_id` integer NOT NULL,
	`season_id` integer NOT NULL,
	`episodes_watched` integer DEFAULT 0 NOT NULL,
	`last_watched_at` numeric,
	`completed_at` numeric,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	FOREIGN KEY (`user_series_id`) REFERENCES `user_series`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_season_progress_episodes_watched_check" CHECK("user_season_progress"."episodes_watched" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_season_progress_user_series_season_unique` ON `user_season_progress` (`user_series_id`,`season_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_season_progress_user_series_id_index` ON `user_season_progress` (`user_series_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `movies_to_genres` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`movie_id` integer NOT NULL,
	`genres_id` integer NOT NULL,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`genres_id`) REFERENCES `genres`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `movies_to_genres_movie_genre_unique` ON `movies_to_genres` (`movie_id`,`genres_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `series_to_genres` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`series_id` integer NOT NULL,
	`genres_id` integer NOT NULL,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`genres_id`) REFERENCES `genres`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `series_to_genres_series_genre_unique` ON `series_to_genres` (`series_id`,`genres_id`);
