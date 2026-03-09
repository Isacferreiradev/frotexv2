-- Manual migration to add quote_code column to quotes table
-- This is needed because the Railway DB is out of sync with the Drizzle schema

ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "quote_code" text;

-- Optional: Populate existing quotes with a dummy code if needed
UPDATE "quotes" SET "quote_code" = 'Q-' || id::text WHERE "quote_code" IS NULL;

-- Ensure it's NOT NULL for future entries if the schema requires it, 
-- but better to keep it nullable for now to avoid migration failures on existing data.
-- ALTER TABLE "quotes" ALTER COLUMN "quote_code" SET NOT NULL;
