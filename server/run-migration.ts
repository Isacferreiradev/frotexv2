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
                    WHERE table_name = 'users' AND column_name = 'system_role'
                ) THEN
                    ALTER TABLE users
                        ADD COLUMN system_role TEXT NOT NULL DEFAULT 'user';
                    RAISE NOTICE 'system_role column added successfully!';
                ELSE
                    RAISE NOTICE 'system_role column already exists, skipping.';
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
