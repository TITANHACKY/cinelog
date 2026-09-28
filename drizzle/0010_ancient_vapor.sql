ALTER TABLE `user_movies` ADD `last_watched_at` numeric;--> statement-breakpoint
CREATE INDEX `user_movies_user_id_last_watched_at_index` ON `user_movies` (`user_id`,`last_watched_at`);--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `smart_collections_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `user_movies` SET `last_watched_at` = COALESCE(`updated_at`, `created_at`) WHERE `watch_status` = 1;