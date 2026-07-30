CREATE TABLE `inquiry_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inquiry_id` integer NOT NULL,
	`requested_at` text,
	`received_at` text,
	`review_text` text DEFAULT '' NOT NULL,
	`review_url` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inquiry_reviews_inquiry_id_unique` ON `inquiry_reviews` (`inquiry_id`);