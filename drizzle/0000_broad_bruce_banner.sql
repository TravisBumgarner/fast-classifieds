CREATE TABLE `api_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`response_id` text,
	`model` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text,
	`input_tokens` integer NOT NULL,
	`output_tokens` integer NOT NULL,
	`total_tokens` integer NOT NULL,
	`cached_tokens` integer,
	`reasoning_tokens` integer,
	`prompt` text,
	`site_content` text,
	`site_url` text,
	`output_text` text,
	`temperature` integer,
	`service_tier` text,
	`reasoning_effort` text
);
--> statement-breakpoint
CREATE TABLE `hashes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`site_url` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hashes_hash_unique` ON `hashes` (`hash`);--> statement-breakpoint
CREATE TABLE `job_postings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company` text,
	`title` text NOT NULL,
	`site_url` text NOT NULL,
	`site_id` integer,
	`explanation` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scrape_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text NOT NULL,
	`total_sites` integer DEFAULT 0 NOT NULL,
	`successful_sites` integer DEFAULT 0 NOT NULL,
	`failed_sites` integer DEFAULT 0 NOT NULL,
	`comments` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `scrape_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scrape_run_id` integer NOT NULL,
	`site_id` integer NOT NULL,
	`site_url` text NOT NULL,
	`status` text NOT NULL,
	`new_postings_found` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_title` text NOT NULL,
	`site_url` text NOT NULL,
	`prompt_id` integer NOT NULL,
	`selector` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_site_url_unique` ON `sites` (`site_url`);