-- Add new columns as nullable first
ALTER TABLE `api_usage` ADD `actual_model` text;--> statement-breakpoint
ALTER TABLE `api_usage` ADD `user_selected_model` text;--> statement-breakpoint

-- Copy existing model data to both new columns
UPDATE `api_usage` SET `actual_model` = `model`, `user_selected_model` = `model`;--> statement-breakpoint

-- Make the new columns NOT NULL (SQLite doesn't support ALTER COLUMN, so we'll rely on the schema constraint)
-- The schema now expects these to be NOT NULL, and we've populated all existing records

-- Drop the old model column
ALTER TABLE `api_usage` DROP COLUMN `model`;