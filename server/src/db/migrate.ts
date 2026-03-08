import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { withRetry } from '../utils/retry';

dotenv.config();

export async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined');
        return;
    }

    console.log('⏳ Connecting to database for migrations...');
    const pool = new pg.Pool({
        connectionString,
        ssl: !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1') ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
    });

    const db = drizzle(pool);

    const migrationsFolder = __dirname.includes('dist')
        ? path.join(__dirname, 'migrations')
        : path.join(__dirname, '..', 'db', 'migrations');

    try {
        await withRetry(async () => {
            console.log('⏳ Running migrations from folder:', migrationsFolder);
            await migrate(db, { migrationsFolder });
        }, { retries: 5, delay: 3000 });

        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed after multiple attempts:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    runMigration().catch(err => {
        console.error('❌ Error seeding:', err);
        process.exit(1);
    });
}
