CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`category` text NOT NULL,
	`criteria` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`employee_id` text,
	`role` text DEFAULT 'field_agent' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`specialties` text DEFAULT '[]',
	`color_code` text DEFAULT '#3B82F6',
	`hourly_rate` real,
	`commission_rate` real,
	`hire_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_usage_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`feature` text NOT NULL,
	`tokens_used` integer NOT NULL,
	`cost` real NOT NULL,
	`timestamp` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`related_type` text NOT NULL,
	`related_id` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `client_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`sent_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `client_portal_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_portal_tokens_token_unique` ON `client_portal_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`state` text,
	`zip` text,
	`notes` text,
	`cancellation_history` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contractor_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`achievement_id` integer NOT NULL,
	`earned_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contractors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`username` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`company_name` text NOT NULL,
	`phone` text,
	`website` text,
	`address` text,
	`city` text,
	`state` text,
	`zip` text,
	`country` text DEFAULT 'USA',
	`role` text DEFAULT 'contractor' NOT NULL,
	`plan` text DEFAULT 'basic' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`subscription_status` text DEFAULT 'active' NOT NULL,
	`plan_start_date` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`plan_end_date` integer,
	`current_client_count` integer DEFAULT 0 NOT NULL,
	`ai_usage_this_month` integer DEFAULT 0 NOT NULL,
	`ai_usage_reset_date` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`settings` text DEFAULT '{}',
	`language` text DEFAULT 'en' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contractors_email_unique` ON `contractors` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `contractors_username_unique` ON `contractors` (`username`);--> statement-breakpoint
CREATE TABLE `estimate_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`estimate_id` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`amount` real NOT NULL,
	`notes` text,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`project_id` integer,
	`agent_id` integer,
	`estimate_number` text NOT NULL,
	`issue_date` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`expiry_date` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`estimate_type` text DEFAULT 'agent' NOT NULL,
	`appointment_date` integer,
	`appointment_duration` integer DEFAULT 60,
	`subtotal` real NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`terms` text,
	`notes` text,
	`client_signature` text,
	`contractor_signature` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`zip` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`client_id` integer,
	`project_id` integer,
	`agent_id` integer,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`estimate_id` integer,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduled_date` integer NOT NULL,
	`completed_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`amount` real NOT NULL,
	`notes` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`project_id` integer,
	`estimate_id` integer,
	`invoice_number` text NOT NULL,
	`issue_date` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`due_date` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`subtotal` real NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`terms` text,
	`notes` text,
	`client_signature` text,
	`contractor_signature` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit` text NOT NULL,
	`cost` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `message_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` integer NOT NULL,
	`contractor_id` integer NOT NULL,
	`reply` text NOT NULL,
	`sent_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `client_messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `price_configurations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`name` text NOT NULL,
	`configuration` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`budget` real,
	`notes` text,
	`worker_instructions` text,
	`worker_notes` text,
	`materials_needed` text DEFAULT '[]',
	`safety_requirements` text,
	`ai_project_summary` text,
	`ai_analysis` text DEFAULT '{}',
	`ai_generated_description` text,
	`ai_sharing_settings` text DEFAULT '{"installers": false, "clients": true, "estimators": true}',
	`last_ai_update` integer,
	`position` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `property_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`property_address` text NOT NULL,
	`measurements` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_pricing` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`service_name` text NOT NULL,
	`base_price` real NOT NULL,
	`unit` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` blob NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`interval` text NOT NULL,
	`features` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timeclock_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contractor_id` integer NOT NULL,
	`agent_id` integer NOT NULL,
	`project_id` integer,
	`clock_in` integer NOT NULL,
	`clock_out` integer,
	`total_hours` real,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
