CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text,
	`title` text NOT NULL,
	`notes` text DEFAULT '',
	`tags` text DEFAULT '',
	`domain` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
