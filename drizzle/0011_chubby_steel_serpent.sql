CREATE TABLE `franchises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`name` text NOT NULL,
	`overview` text,
	`poster_path` text,
	`backdrop_path` text,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric
);
--> statement-breakpoint
CREATE UNIQUE INDEX `franchises_tmdb_id_unique` ON `franchises` (`tmdb_id`);--> statement-breakpoint
CREATE INDEX `franchises_name_index` ON `franchises` (`name`);--> statement-breakpoint
CREATE TABLE `user_franchises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`franchise_id` integer NOT NULL,
	`created_at` numeric DEFAULT (unixepoch()) NOT NULL,
	`updated_at` numeric,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`franchise_id`) REFERENCES `franchises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_franchises_user_id_franchise_id_unique` ON `user_franchises` (`user_id`,`franchise_id`);--> statement-breakpoint
CREATE INDEX `user_franchises_user_id_index` ON `user_franchises` (`user_id`);