ALTER TABLE `movies` ADD `franchise_id` integer REFERENCES franchises(id);--> statement-breakpoint
CREATE INDEX `movies_franchise_id_index` ON `movies` (`franchise_id`);