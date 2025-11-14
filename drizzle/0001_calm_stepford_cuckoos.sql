PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_job_postings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company` text,
	`title` text NOT NULL,
	`site_url` text NOT NULL,
	`site_id` integer,
	`explanation` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_job_postings`("id", "company", "title", "site_url", "site_id", "explanation", "status", "created_at", "updated_at") SELECT "id", "company", "title", "site_url", "site_id", "explanation", "status", "created_at", "updated_at" FROM `job_postings`;--> statement-breakpoint
DROP TABLE `job_postings`;--> statement-breakpoint
ALTER TABLE `__new_job_postings` RENAME TO `job_postings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;