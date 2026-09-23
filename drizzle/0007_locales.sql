CREATE TABLE `languages` (
	`iso_639_1` text PRIMARY KEY NOT NULL,
	`english_name` text NOT NULL,
	`created_at` numeric DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`iso_3166_1` text PRIMARY KEY NOT NULL,
	`english_name` text NOT NULL,
	`created_at` numeric DEFAULT (unixepoch())
);
