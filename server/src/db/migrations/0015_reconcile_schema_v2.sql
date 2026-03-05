-- Manual reconciliation migration to add missing columns from schema.ts
-- Target tables: users, rentals, tenants

-- 1. Table users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 1 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_token" text;

-- 2. Table rentals
ALTER TABLE "rentals" ADD COLUMN IF NOT EXISTS "equipment_condition" text;
ALTER TABLE "rentals" ADD COLUMN IF NOT EXISTS "usage_hours" numeric(10, 2);
ALTER TABLE "rentals" ADD COLUMN IF NOT EXISTS "damage_notes" text;

-- 3. Table tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "asaas_api_key" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "asaas_wallet_id" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_secret_key" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "payment_provider" text DEFAULT 'none';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "state" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "operational_profile" jsonb DEFAULT '{"toolCountRange":null,"currentControlMethod":null,"activeRentalsRange":null}'::jsonb;
