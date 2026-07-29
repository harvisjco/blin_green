CREATE TABLE `inquiry_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inquiry_id` integer NOT NULL,
	`product_id` integer,
	`product_name` text NOT NULL,
	`width_cm` integer NOT NULL,
	`height_cm` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`unit_cost` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`family` text DEFAULT '커튼' NOT NULL,
	`unit` text DEFAULT 'm2' NOT NULL,
	`price_cents` integer NOT NULL,
	`cost_cents` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
