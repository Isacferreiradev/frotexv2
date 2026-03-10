import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('🔄 Running subscription columns migration...');
    try {
        await db.execute(sql`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'tenants' AND column_name = 'subscription_status'
                ) THEN
                    ALTER TABLE tenants
                        ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'active',
                        ADD COLUMN trial_ends_at TIMESTAMPTZ,
                        ADD COLUMN subscription_ends_at TIMESTAMPTZ,
                        ADD COLUMN is_manual_lock BOOLEAN NOT NULL DEFAULT FALSE,
                        ADD COLUMN lock_reason TEXT;
                    RAISE NOTICE 'Columns added successfully!';
                ELSE
                    RAISE NOTICE 'Columns already exist, skipping.';
                END IF;
            END $$;
        `);
        console.log('✅ Migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
    process.exit(0);
}

migrate();
