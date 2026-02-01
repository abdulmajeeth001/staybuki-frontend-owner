-- Add gender column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" text;

-- Add gender column to tenants table
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "gender" text;

-- Add check constraints for valid gender values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_gender_check') THEN
        ALTER TABLE "users" ADD CONSTRAINT users_gender_check CHECK ("gender" IN ('male', 'female', 'other') OR "gender" IS NULL);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_gender_check') THEN
        ALTER TABLE "tenants" ADD CONSTRAINT tenants_gender_check CHECK ("gender" IN ('male', 'female', 'other') OR "gender" IS NULL);
    END IF;
END$$;
