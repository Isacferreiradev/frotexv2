-- Migration: Add missing columns and tables to align production schema with codebase
-- Fixes 500 errors for: rentals.deleted_at, quotes.deleted_at, tools.last_maintenance_usage_hours, dismissed_alerts

-- 1. Add deleted_at to rentals (soft delete support)
ALTER TABLE "rentals" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

-- 2. Add deleted_at to quotes (soft delete support)
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

-- 3. Add deleted_at to tools (soft delete support)
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

-- 4. Add last_maintenance_usage_hours to tools (tracks usage hours at last maintenance)
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "last_maintenance_usage_hours" numeric DEFAULT '0.00';

-- 5. Add subcategory_id to tools (optional subcategory reference)
ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "subcategory_id" uuid;

-- 6. Create dismissed_alerts table (for alert dismissal tracking)
CREATE TABLE IF NOT EXISTS "dismissed_alerts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" uuid NOT NULL,
    "alert_id" text NOT NULL,
    "dismissed_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 7. Add foreign key for dismissed_alerts -> tenants (safe check)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dismissed_alerts_tenant_id_tenants_id_fk') THEN
        ALTER TABLE "dismissed_alerts" ADD CONSTRAINT "dismissed_alerts_tenant_id_tenants_id_fk"
            FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
