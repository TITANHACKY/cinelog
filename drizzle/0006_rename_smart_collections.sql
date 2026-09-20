ALTER TABLE `custom_collections` RENAME TO `smart_collections`;--> statement-breakpoint
ALTER TABLE `custom_collection_filters` RENAME TO `smart_collection_filters`;--> statement-breakpoint
ALTER TABLE `custom_collection_sorts` RENAME TO `smart_collection_sorts`;--> statement-breakpoint
ALTER TABLE `smart_collection_filters` RENAME COLUMN `custom_collection_id` TO `smart_collection_id`;--> statement-breakpoint
ALTER TABLE `smart_collection_sorts` RENAME COLUMN `custom_collection_id` TO `smart_collection_id`;--> statement-breakpoint
DROP INDEX IF EXISTS `custom_collections_user_id_index`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `smart_collections_user_id_index` ON `smart_collections` (`user_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `custom_collection_filters_collection_id_index`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `smart_collection_filters_collection_id_index` ON `smart_collection_filters` (`smart_collection_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `custom_collection_sorts_collection_id_index`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `smart_collection_sorts_collection_id_index` ON `smart_collection_sorts` (`smart_collection_id`);