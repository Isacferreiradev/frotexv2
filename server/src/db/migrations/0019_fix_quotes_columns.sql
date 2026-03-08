-- Hotfix: Ensure quotes table has the required columns for the 360 view
-- This fixes the "column customers_quotes.quote_code does not exist" error

-- 1. Add quote_code if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'quote_code') THEN
        ALTER TABLE "quotes" ADD COLUMN "quote_code" text;
        -- Optional: Update existing rows with a placeholder if they exist
        UPDATE "quotes" SET "quote_code" = 'Q-' || id::text WHERE "quote_code" IS NULL;
        -- Now make it not null
        ALTER TABLE "quotes" ALTER COLUMN "quote_code" SET NOT NULL;
    END IF;
END $$;

-- 2. Add total_discount if missing (observed in schema but might be missing in production)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'total_discount') THEN
        ALTER TABLE "quotes" ADD COLUMN "total_discount" numeric(10, 2) DEFAULT '0.00';
    END IF;
END $$;

-- 3. Add valid_until if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'valid_until') THEN
        ALTER TABLE "quotes" ADD COLUMN "valid_until" timestamp with time zone;
    END IF;
END $$;

-- 4. Add notes if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'notes') THEN
        ALTER TABLE "quotes" ADD COLUMN "notes" text;
    END IF;
END $$;

-- 5. Add deleted_at if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'deleted_at') THEN
        ALTER TABLE "quotes" ADD COLUMN "deleted_at" timestamp with time zone;
    END IF;
END $$;
