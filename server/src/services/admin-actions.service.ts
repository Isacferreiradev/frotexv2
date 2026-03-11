import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

/**
 * Service dedicated to Manual administrative overrides over the SaaS
 */
export class AdminActionsService {

    /**
     * Mutate Tenant's core status and plan (e.g. forced upgrades or downgrades)
     */
    static async updateTenant(tenantId: string, payload: {
        plan?: 'free' | 'pro' | 'premium';
        subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
        isManualLock?: boolean;
        lockReason?: string | null;
    }) {
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        if (!tenant) throw new AppError(404, 'Tenant not found');

        const [updated] = await db.update(tenants)
            .set({
                ...payload,
                updatedAt: new Date()
            })
            .where(eq(tenants.id, tenantId))
            .returning();

        logger.info(`[ADMIN MASTER] Tenant ${tenantId} updated: ${JSON.stringify(payload)}`);

        return updated;
    }

    /**
     * Permanent Deletion of a Tenant. 
     * WARNING: This triggers ON DELETE CASCADE in the DB for Users, Customers, Tools, Rentals.
     */
    static async deleteTenant(tenantId: string) {
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        if (!tenant) throw new AppError(404, 'Tenant not found');

        // Due to `onDelete: cascade` defined globally in the schema, this will wipe everything.
        await db.delete(tenants).where(eq(tenants.id, tenantId));

        logger.warn(`[ADMIN MASTER] SEC ALERT: Tenant ${tenantId} (${tenant.name}) has been PERMANENTLY DELETED.`);

        return { success: true, message: `Tenant ${tenantId} deleted completely.` };
    }

}
