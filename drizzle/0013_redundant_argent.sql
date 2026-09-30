ALTER TABLE `franchises` ADD `number_of_parts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_franchises` ADD `number_of_parts_completed` integer DEFAULT 0 NOT NULL;