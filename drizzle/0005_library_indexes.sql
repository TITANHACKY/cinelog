CREATE INDEX IF NOT EXISTS `user_movies_user_id_watch_status_index` ON `user_movies` (`user_id`,`watch_status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_movies_user_id_impression_index` ON `user_movies` (`user_id`,`impression`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_movies_user_id_completed_at_index` ON `user_movies` (`user_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_series_user_id_watch_status_index` ON `user_series` (`user_id`,`watch_status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_series_user_id_impression_index` ON `user_series` (`user_id`,`impression`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_series_user_id_completed_at_index` ON `user_series` (`user_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_series_user_id_last_watched_at_index` ON `user_series` (`user_id`,`last_watched_at`);
