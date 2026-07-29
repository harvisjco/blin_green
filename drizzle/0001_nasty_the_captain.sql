CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`area` text DEFAULT '' NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`consultation_id` integer,
	`source` text DEFAULT 'manual' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`interest` text DEFAULT '' NOT NULL,
	`quote_amount` integer,
	`quote_note` text DEFAULT '' NOT NULL,
	`scheduled_at` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inquiry_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inquiry_id` integer NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON UPDATE no action ON DELETE no action
);
