CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`user_question` text NOT NULL,
	`ai_response` text NOT NULL,
	`log_file_key` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
