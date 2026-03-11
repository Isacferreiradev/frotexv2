import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const client = new Client({
    connectionString: databaseUrl,
});

async function migrate() {
    console.log('🚀 Starting AbacatePay Billing migration...');

    try {
        await client.connect();
        console.log('Connected to database.');

        // Start transaction
        await client.query('BEGIN');

        console.log('Creating billing_charges table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing_charges (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                plan_requested TEXT NOT NULL,
                amount NUMERIC(12, 2) NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                abacate_pay_id TEXT UNIQUE,
                method TEXT NOT NULL DEFAULT 'PIX_QRCODE',
                dev_mode BOOLEAN NOT NULL DEFAULT false,
                br_code TEXT,
                br_code_base64 TEXT,
                expires_at TIMESTAMPTZ,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        console.log('Adding constraints and indexes...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_billing_charges_tenant_id ON billing_charges(tenant_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_billing_charges_status ON billing_charges(status);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_billing_charges_abacate_pay_id ON billing_charges(abacate_pay_id);');

        await client.query('COMMIT');
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
