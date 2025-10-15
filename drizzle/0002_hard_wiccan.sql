CREATE TABLE `faq_index` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tags` text,
	`r2_key` text NOT NULL,
	`last_indexed` integer DEFAULT CURRENT_TIMESTAMP,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faq_index_file_name_unique` ON `faq_index` (`file_name`);