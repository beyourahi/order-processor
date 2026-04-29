DROP TABLE `brand_settings`;
--> statement-breakpoint
CREATE TABLE `brand_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`contact_name` text,
	`contact_phone` text,
	`merchant_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brand_settings_user_id_unique` ON `brand_settings` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_brand_settings_user_id` ON `brand_settings` (`user_id`);
