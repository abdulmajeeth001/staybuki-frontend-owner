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
CREATE TABLE "emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"relationship" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
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
	"rejection_reason" text,
	"due_date" timestamp,
	"paid_at" timestamp,
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
	"created_at" timestamp DEFAULT now()
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
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"pg_id" integer,
	"room_id" integer,
	"user_id" integer,
	"name" text NOT NULL,
	"email" text DEFAULT '',
	"phone" text NOT NULL,
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
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_visit_request_id_visit_requests_id_fk" FOREIGN KEY ("visit_request_id") REFERENCES "public"."visit_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_master" ADD CONSTRAINT "pg_master_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_master" ADD CONSTRAINT "pg_master_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_ratings" ADD CONSTRAINT "pg_ratings_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_ratings" ADD CONSTRAINT "pg_ratings_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;