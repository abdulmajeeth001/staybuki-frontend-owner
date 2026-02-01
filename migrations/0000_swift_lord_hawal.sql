CREATE TABLE "amenities_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"requires_certificate" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"heading" text NOT NULL,
	"details" text NOT NULL,
	"priority" text DEFAULT 'medium',
	"target_rooms" integer[],
	"target_floors" integer[],
	"target_tenants" integer[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "beds" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"pg_id" integer NOT NULL,
	"position" text NOT NULL,
	"display_order" integer DEFAULT 1,
	"tenant_id" integer,
	"status" text DEFAULT 'available',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"tenant_id" integer,
	"room_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium',
	"status" text DEFAULT 'open',
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "electricity_billing_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"billing_month" text NOT NULL,
	"invoice_number" text,
	"total_amount" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'draft',
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "electricity_room_bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"pg_id" integer NOT NULL,
	"meter_number" text,
	"previous_reading" numeric(10, 2),
	"current_reading" numeric(10, 2) NOT NULL,
	"units_consumed" numeric(10, 2) NOT NULL,
	"room_amount" numeric(10, 2) NOT NULL,
	"rate_per_unit" numeric(10, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "electricity_tenant_charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_bill_id" integer NOT NULL,
	"cycle_id" integer NOT NULL,
	"tenant_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"pg_id" integer NOT NULL,
	"share_amount" numeric(10, 2) NOT NULL,
	"active_days" integer,
	"total_room_days" integer,
	"share_percentage" numeric(5, 2),
	"due_date" timestamp,
	"payment_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"relationship" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "food_menu" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"day_of_week" text NOT NULL,
	"meal_type" text NOT NULL,
	"items" text[] NOT NULL,
	"is_veg" boolean[] NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"pg_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"reference_id" integer,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"visit_request_id" integer,
	"pg_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"tenant_image" text,
	"aadhar_card" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	"status" text DEFAULT 'pending',
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"mobile" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"pg_id" integer,
	"amount" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_method" text,
	"transaction_id" text,
	"payment_screenshot" text,
	"rejection_reason" text,
	"payment_month" text,
	"generated_at" timestamp,
	"due_date" timestamp,
	"paid_at" timestamp,
	"deleted_by" integer,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pg_amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pg_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"pg_name" text NOT NULL,
	"pg_address" text NOT NULL,
	"pg_location" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"image_url" text,
	"total_rooms" integer DEFAULT 0,
	"rent_payment_date" integer,
	"status" text DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"is_active" boolean DEFAULT true,
	"subscription_status" text DEFAULT 'trial',
	"subscription_expires_at" timestamp,
	"last_payment_generated_at" timestamp,
	"last_payment_generated_month" text,
	"registration_number" text,
	"registration_document_url" text,
	"fssai_certificate_url" text,
	"pg_type" text DEFAULT 'common',
	"has_food" boolean DEFAULT false,
	"has_parking" boolean DEFAULT false,
	"has_ac" boolean DEFAULT false,
	"has_cctv" boolean DEFAULT false,
	"has_wifi" boolean DEFAULT false,
	"has_laundry" boolean DEFAULT false,
	"has_gym" boolean DEFAULT false,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_ratings" integer DEFAULT 0,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pg_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"cleanliness" integer,
	"safety" integer,
	"facilities" integer,
	"value_for_money" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pg_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"billing_cycle" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_method" text,
	"transaction_id" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"paid_at" timestamp,
	"invoice_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"pg_id" integer,
	"room_number" text NOT NULL,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"tenant_ids" integer[] DEFAULT '{}',
	"sharing" integer DEFAULT 1,
	"floor" integer DEFAULT 1,
	"has_attached_bathroom" boolean DEFAULT false,
	"has_ac" boolean DEFAULT false,
	"status" text DEFAULT 'vacant',
	"amenities" text[] DEFAULT '{}',
	"meter_number" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"device_name" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"ip_address" text,
	"last_active_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"monthly_price" numeric(10, 2) NOT NULL,
	"yearly_price" numeric(10, 2),
	"max_rooms" integer,
	"max_tenants" integer,
	"features" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"pg_id" integer,
	"room_id" integer,
	"room_number" text,
	"move_in_date" timestamp NOT NULL,
	"move_out_date" timestamp NOT NULL,
	"owner_feedback" text,
	"rating" integer,
	"behavior_tags" text[] DEFAULT '{}',
	"recorded_by_owner_id" integer NOT NULL,
	"verification_status" text DEFAULT 'verified',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"pg_id" integer,
	"room_id" integer,
	"bed_id" integer,
	"user_id" integer,
	"name" text NOT NULL,
	"email" text DEFAULT '',
	"phone" text NOT NULL,
	"gender" text,
	"room_number" text NOT NULL,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"tenant_image" text,
	"aadhar_card" text,
	"photo_url" text,
	"id_proof_url" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"relationship" text,
	"status" text DEFAULT 'active',
	"onboarding_status" text DEFAULT 'not_onboarded',
	"join_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text NOT NULL,
	"password" text,
	"user_type" text DEFAULT 'owner',
	"gender" text,
	"pg_address" text,
	"pg_location" text,
	"is_verified" boolean DEFAULT false,
	"requires_password_reset" boolean DEFAULT false,
	"google_id" text,
	"subscription_tier" text DEFAULT 'none',
	"subscription_expires_at" timestamp,
	"upi_id" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visit_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"pg_id" integer NOT NULL,
	"room_id" integer,
	"owner_id" integer NOT NULL,
	"requested_date" timestamp NOT NULL,
	"requested_time" text NOT NULL,
	"status" text DEFAULT 'pending',
	"rescheduled_date" timestamp,
	"rescheduled_time" text,
	"rescheduled_by" text,
	"confirmed_date" timestamp,
	"confirmed_time" text,
	"notes" text,
	"owner_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_billing_cycles" ADD CONSTRAINT "electricity_billing_cycles_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_billing_cycles" ADD CONSTRAINT "electricity_billing_cycles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_room_bills" ADD CONSTRAINT "electricity_room_bills_cycle_id_electricity_billing_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."electricity_billing_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_room_bills" ADD CONSTRAINT "electricity_room_bills_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_room_bills" ADD CONSTRAINT "electricity_room_bills_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_room_bill_id_electricity_room_bills_id_fk" FOREIGN KEY ("room_bill_id") REFERENCES "public"."electricity_room_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_cycle_id_electricity_billing_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."electricity_billing_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_menu" ADD CONSTRAINT "food_menu_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_menu" ADD CONSTRAINT "food_menu_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_visit_request_id_visit_requests_id_fk" FOREIGN KEY ("visit_request_id") REFERENCES "public"."visit_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_amenities" ADD CONSTRAINT "pg_amenities_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_amenities" ADD CONSTRAINT "pg_amenities_amenity_id_amenities_master_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_master" ADD CONSTRAINT "pg_master_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_master" ADD CONSTRAINT "pg_master_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_ratings" ADD CONSTRAINT "pg_ratings_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_ratings" ADD CONSTRAINT "pg_ratings_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_recorded_by_owner_id_users_id_fk" FOREIGN KEY ("recorded_by_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pg_master_primary_per_owner_idx" ON "pg_master" USING btree ("owner_id") WHERE "pg_master"."is_primary" = true;