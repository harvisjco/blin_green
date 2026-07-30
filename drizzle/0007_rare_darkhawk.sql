CREATE TABLE `partner_referrals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inquiry_id` integer NOT NULL,
	`partner_id` integer NOT NULL,
	`referred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`job_amount` integer,
	`fee_amount` integer,
	`fee_status` text DEFAULT 'pending' NOT NULL,
	`paid_at` text,
	`memo` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partner_referrals_inquiry_id_unique` ON `partner_referrals` (`inquiry_id`);--> statement-breakpoint
CREATE TABLE `partners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT '커튼·블라인드' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`areas` text DEFAULT '' NOT NULL,
	`fee_type` text DEFAULT 'percent' NOT NULL,
	`fee_value` integer DEFAULT 0 NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
