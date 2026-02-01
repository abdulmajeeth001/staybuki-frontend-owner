ALTER TABLE "pg_master" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "image_url" text;