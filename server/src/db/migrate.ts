import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

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
        ssl: !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1') ? { rejectUnauthorized: false } : false
    });

    const db = drizzle(pool);

    // Look for migrations in both src and dist (production)
    const migrationsFolder = __dirname.includes('dist')
        ? path.join(__dirname, 'migrations')
        : path.join(__dirname, '..', 'db', 'migrations');

    console.log('⏳ Running migrations from folder:', migrationsFolder);

    try {
        await migrate(db, { migrationsFolder });
        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
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
