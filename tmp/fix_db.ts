import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

async function fix() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('⏳ Adding deleted_at column to customers table...');
        await pool.query(`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
        `);
        console.log('✅ Column added successfully!');

        console.log('⏳ Adding index for deleted_at...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers (deleted_at);
        `);
        console.log('✅ Index created successfully!');

    } catch (err) {
        console.error('❌ Error fixing database:', err);
    } finally {
        await pool.end();
    }
}

fix();
