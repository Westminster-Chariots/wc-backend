CREATE TYPE "public"."app_role" AS ENUM('admin', 'client');--> statement-breakpoint
CREATE TYPE "public"."vehicle_class" AS ENUM('sedan', 'suv');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'assigned', 'en_route', 'on_site', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" DEFAULT 'client' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text,
	"email" text,
	"phone" text,
	"avatar_url" text,
	"is_corporate" boolean DEFAULT false,
	"corporate_name" text,
	"client_code" text,
	"state_abbrev" text DEFAULT 'D',
	"notes" text,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"status" text DEFAULT 'available' NOT NULL,
	"vehicle_id" uuid,
	"photo_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_type" "vehicle_class" NOT NULL,
	"make" text DEFAULT 'Mercedes-Benz' NOT NULL,
	"model" text NOT NULL,
	"plate" text NOT NULL,
	"year" integer,
	"color" text DEFAULT 'Black',
	"status" text DEFAULT 'available' NOT NULL,
	"image_url" text,
	"passenger_capacity" integer DEFAULT 3,
	"luggage_capacity" integer DEFAULT 2,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"reservation_number" text NOT NULL,
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"pickup_date" date NOT NULL,
	"pickup_time" time NOT NULL,
	"vehicle_type" text DEFAULT 'sedan' NOT NULL,
	"is_airport_pickup" boolean DEFAULT false,
	"flight_number" text,
	"special_requests" text,
	"distance_miles" numeric(6, 1),
	"duration_minutes" integer,
	"base_price" numeric(10, 2),
	"gratuity" numeric(10, 2),
	"wait_time_fee" numeric(10, 2) DEFAULT '0',
	"total_price" numeric(10, 2),
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"gatekeeper_status" text DEFAULT 'standard',
	"driver_id" uuid,
	"dispatcher_notes" text,
	"client_name" text,
	"client_phone" text,
	"client_email" text,
	"email_phase" text,
	"trip_group_id" text,
	"leg_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reservation_number_unique" UNIQUE("reservation_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"booking_id" uuid,
	"description" text NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"passenger_name" text,
	"pickup_date" date,
	"pickup_time" text,
	"routing_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"client_user_id" uuid,
	"client_name" text NOT NULL,
	"client_email" text,
	"client_phone" text,
	"client_address" text,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" date,
	"payment_terms" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "flat_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"sedan_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"suv_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"radius_miles" numeric(6, 1) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_type" text NOT NULL,
	"base_rate" numeric(10, 2) DEFAULT '30' NOT NULL,
	"rate_per_mile" numeric(10, 2) DEFAULT '4.00' NOT NULL,
	"rate_per_minute" numeric(10, 2) DEFAULT '1.25' NOT NULL,
	"gratuity_percent" numeric(5, 2) DEFAULT '20' NOT NULL,
	"wait_time_hourly" numeric(10, 2) DEFAULT '95' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"performed_by" uuid,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"heading" text NOT NULL,
	"body" text NOT NULL,
	"cta_text" text,
	"cta_url" text,
	"audience" text NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer,
	"failed_count" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispatcher_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"booking_id" uuid,
	"due_date" timestamp,
	"completed_at" timestamp,
	"completed_by" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_vehicle_id_fleet_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."fleet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_config" ADD CONSTRAINT "pricing_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_history" ADD CONSTRAINT "campaign_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatcher_tasks" ADD CONSTRAINT "dispatcher_tasks_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatcher_tasks" ADD CONSTRAINT "dispatcher_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatcher_tasks" ADD CONSTRAINT "dispatcher_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;