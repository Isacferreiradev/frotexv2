import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../config/env';
import logger from '../utils/logger';

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: !env.DATABASE_URL.includes('localhost') && !env.DATABASE_URL.includes('127.0.0.1')
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 15000, // Increased from 5s to 15s
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle DB client', err);
});

export const db = drizzle(pool, { schema });

/**
 * Set the app.current_tenant session variable for RLS.
 * Must be called before any tenant-scoped query.
 */
export async function setTenantContext(client: any, tenantId: string) {
    // Basic UUID validation to prevent SQL Injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
        throw new Error('Invalid tenantId format');
    }
    await client.query(`SET app.current_tenant = '${tenantId}'`);
}

export { pool };
