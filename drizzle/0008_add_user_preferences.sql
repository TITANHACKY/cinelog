CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`media_lean` integer DEFAULT 2 NOT NULL,
	`min_rating` real,
	`eras` text,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_preferences_media_lean_check" CHECK("user_preferences"."media_lean" IN (0, 1, 2)),
	CONSTRAINT "user_preferences_min_rating_check" CHECK("user_preferences"."min_rating" IS NULL OR ("user_preferences"."min_rating" >= 0 AND "user_preferences"."min_rating" <= 10))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_preferred_genres` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`genre_tmdb_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferred_genres_user_genre_unique` ON `user_preferred_genres` (`user_id`,`genre_tmdb_id`);--> statement-breakpoint
CREATE INDEX `user_preferred_genres_user_id_index` ON `user_preferred_genres` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_preferred_languages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`language_code` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferred_languages_user_lang_unique` ON `user_preferred_languages` (`user_id`,`language_code`);--> statement-breakpoint
CREATE INDEX `user_preferred_languages_user_id_index` ON `user_preferred_languages` (`user_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_completed_at` numeric;
