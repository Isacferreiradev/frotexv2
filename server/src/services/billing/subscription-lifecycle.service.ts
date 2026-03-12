import { db } from '../../db';
import { subscriptions, billingEvents, tenants, billingCharges } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import logger from '../../utils/logger';

export class SubscriptionLifecycleService {
    /**
     * Activate a subscription for a tenant after a successful payment
     */
    static async activateSubscription(tenantId: string, plan: 'pro' | 'scale' | 'premium', chargeId: string) {
        // 1. Check if there's an existing active subscription to replace/update
        const existing = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.tenantId, tenantId),
                eq(subscriptions.status, 'active')
            )
        });

        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days extension

        let subscriptionId: string;

        if (existing) {
            // Upgrade or Extension
            const [updated] = await db.update(subscriptions)
                .set({
                    plan,
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    nextRenewalAt: periodEnd,
                    updatedAt: now
                })
                .where(eq(subscriptions.id, existing.id))
                .returning();
            subscriptionId = updated.id;
            logger.info(`[SUBSCRIPTION] Subscription ${subscriptionId} updated/extended for Tenant ${tenantId}`);
        } else {
            // New Subscription
            const [created] = await db.insert(subscriptions).values({
                tenantId,
                plan,
                status: 'active',
                amount: '0', // Will be updated by BillingService if needed or derived from plan info
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                nextRenewalAt: periodEnd
            }).returning();
            subscriptionId = created.id;
            logger.info(`[SUBSCRIPTION] New subscription ${subscriptionId} created for Tenant ${tenantId}`);
        }

        // 2. Log Audit Event
        await db.insert(billingEvents).values({
            tenantId,
            subscriptionId,
            chargeId,
            type: existing ? 'SUBSCRIPTION_UPDATED' : 'SUBSCRIPTION_CREATED',
            payload: { plan, oldPlan: existing?.plan || 'free' }
        });

        return subscriptionId;
    }

    /**
     * Cancel a subscription
     */
    static async cancelSubscription(subscriptionId: string, reason?: string) {
        const [sub] = await db.update(subscriptions)
            .set({
                status: 'canceled',
                canceledAt: new Date(),
                updatedAt: new Date(),
                metadata: { cancelReason: reason }
            })
            .where(eq(subscriptions.id, subscriptionId))
            .returning();

        if (sub) {
            // Update Tenant Cache
            await db.update(tenants)
                .set({ subscriptionStatus: 'canceled' })
                .where(eq(tenants.id, sub.tenantId));

            await db.insert(billingEvents).values({
                tenantId: sub.tenantId,
                subscriptionId: sub.id,
                type: 'SUBSCRIPTION_CANCELED',
                payload: { reason }
            });
        }

        return sub;
    }

    /**
     * Check and process trial expiration
     * This moves expired trialing subscriptions to a 'failed' or 'expired' state
     */
    static async processTrialExpirations() {
        const now = new Date();
        const expiringTrials = await db.query.subscriptions.findMany({
            where: and(
                eq(subscriptions.status, 'trialing'),
                // For simplicity, we assume trialEnd is set when status is 'trialing'
            )
        });

        for (const sub of expiringTrials) {
            if (sub.trialEnd && sub.trialEnd < now) {
                await this.cancelSubscription(sub.id, 'Trial Expired');
                logger.info(`[SUBSCRIPTION] Trial expired for Tenant ${sub.tenantId}`);
            }
        }
    }

    /**
     * Process Renewals: Identify subscriptions that need a new charge
     */
    static async processRenewals() {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const needingRenewal = await db.query.subscriptions.findMany({
            where: and(
                eq(subscriptions.status, 'active'),
                // nextRenewalAt <= tomorrow
            )
        });

        for (const sub of needingRenewal) {
            if (sub.nextRenewalAt && sub.nextRenewalAt <= tomorrow) {
                // Here we would typically trigger a new charge automatically
                // For PIX, we notify the user or generate a pending charge if they are in 'auto-renew' mode
                logger.info(`[SUBSCRIPTION] Subscription ${sub.id} is due for renewal soon.`);
            }
        }
    }
}
