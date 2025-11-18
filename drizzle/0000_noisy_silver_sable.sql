CREATE TABLE `api_usage` (
	`id` text PRIMARY KEY NOT NULL,
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
	`id` text PRIMARY KEY NOT NULL,
	`site_content_hash` text NOT NULL,
	`prompt_hash` text NOT NULL,
	`job_to_json_prompt_hash` text NOT NULL,
	`site_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hashes_site_content_hash_unique` ON `hashes` (`site_content_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `hashes_prompt_hash_unique` ON `hashes` (`prompt_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `hashes_job_to_json_prompt_hash_unique` ON `hashes` (`job_to_json_prompt_hash`);--> statement-breakpoint
CREATE TABLE `job_postings` (
	`recommended_by_ai` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`scrape_run_id` text NOT NULL,
	`title` text NOT NULL,
	`site_url` text NOT NULL,
	`site_id` text NOT NULL,
	`explanation` text NOT NULL,
	`location` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scrape_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`total_sites` integer DEFAULT 0 NOT NULL,
	`successful_sites` integer DEFAULT 0 NOT NULL,
	`failed_sites` integer DEFAULT 0 NOT NULL,
	`comments` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `scrape_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`scrape_run_id` text NOT NULL,
	`site_id` text NOT NULL,
	`site_url` text NOT NULL,
	`status` text NOT NULL,
	`new_postings_found` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`site_title` text NOT NULL,
	`site_url` text NOT NULL,
	`prompt_id` text NOT NULL,
	`selector` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_site_url_unique` ON `sites` (`site_url`);