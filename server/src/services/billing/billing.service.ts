import { db } from '../../db';
import { tenants, billingCharges, billingEvents } from '../../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { AbacatePayClient } from './abacatepay.service';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';

export class BillingService {
    /**
     * Initiate an upgrade path for a tenant
     */
    static async initiateUpgrade(
        tenantId: string,
        userId: string,
        plan: 'pro' | 'premium' | 'scale',
        customerData?: { name: string; email: string; taxId: string; phone?: string }
    ) {
        // Resolve scale to premium
        const targetPlan = plan === 'scale' ? 'premium' : plan;

        // Define prices (mock/dev values based on plans.ts)
        const prices: Record<string, number> = {
            'pro': 97.00,
            'premium': 197.00
        };

        const amount = prices[targetPlan];
        if (!amount) throw new AppError(400, `Invalid plan: ${plan}`);

        // 1. Create Transparent Checkout on AbacatePay
        const abacateResponse = await AbacatePayClient.createTransparentCheckout({
            amount: Math.round(amount * 100), // Convert to cents
            externalId: tenantId,
            description: `Upgrade de Plano: ${targetPlan.toUpperCase()}`,
            customer: {
                name: customerData?.name || '',
                email: customerData?.email || '',
                taxId: customerData?.taxId || '',
                cellphone: customerData?.phone
            }
        });

        // 2. Persist Local Charge
        const [charge] = await db.insert(billingCharges).values({
            tenantId,
            userId,
            planRequested: targetPlan as any,
            amount: amount.toString(),
            status: 'pending',
            abacatePayId: abacateResponse.id,
            method: 'PIX_QRCODE',
            devMode: abacateResponse.devMode,
            brCode: abacateResponse.brCode,
            brCodeBase64: abacateResponse.brCodeBase64,
            expiresAt: new Date(abacateResponse.expiresAt),
            metadata: { abacateResponse }
        }).returning();

        // 3. Log Event
        await db.insert(billingEvents).values({
            tenantId,
            chargeId: charge.id,
            type: 'CHARGE_CREATED',
            payload: { plan: targetPlan, amount: charge.amount }
        });

        logger.info(`[BILLING] Charge ${charge.id} initiated for Tenant ${tenantId} (${targetPlan})`);

        return charge;
    }

    /**
     * Confirm a payment and release the plan features
     */
    static async confirmPayment(idOrAbacatePayId: string) {
        // Search by either local UUID or AbacatePay internal ID
        const charge = await db.query.billingCharges.findFirst({
            where: (charges, { or, eq }) => or(
                eq(charges.abacatePayId, idOrAbacatePayId),
                idOrAbacatePayId.length === 36 ? eq(charges.id, idOrAbacatePayId) : undefined
            )
        });

        if (!charge) {
            logger.error(`[BILLING] Received payment for unknown charge ID: ${idOrAbacatePayId}`);
            return;
        }

        if (charge.status === 'paid') {
            logger.info(`[BILLING] Charge ${charge.id} already processed.`);
            return;
        }

        // 1. Update Charge Status
        await db.update(billingCharges)
            .set({
                status: 'paid',
                updatedAt: new Date()
            })
            .where(eq(billingCharges.id, charge.id));

        // 2. Update Tenant Plan Cache
        await db.update(tenants)
            .set({
                plan: charge.planRequested as any,
                subscriptionStatus: 'active',
                updatedAt: new Date(),
                subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            })
            .where(eq(tenants.id, charge.tenantId));

        // 3. Activate/Update Subscription Engine
        const subscriptionId = await SubscriptionLifecycleService.activateSubscription(
            charge.tenantId,
            charge.planRequested as any,
            charge.id
        );

        // 4. Update Charge with Subscription Reference
        await db.update(billingCharges)
            .set({ subscriptionId, updatedAt: new Date() })
            .where(eq(billingCharges.id, charge.id));

        // 5. Cleanup: Cancel all other pending charges for this tenant
        await db.update(billingCharges)
            .set({
                status: 'cancelled',
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(billingCharges.tenantId, charge.tenantId),
                    eq(billingCharges.status, 'pending'),
                    ne(billingCharges.id, charge.id)
                )
            );

        // 6. Log Audit Event
        await db.insert(billingEvents).values({
            tenantId: charge.tenantId,
            chargeId: charge.id,
            subscriptionId,
            type: 'PAYMENT_CONFIRMED',
            payload: { plan: charge.planRequested }
        });

        logger.info(`[BILLING] SUCCESS: Tenant ${charge.tenantId} upgraded to ${charge.planRequested} via Charge ${charge.id}`);

        return { success: true, tenantId: charge.tenantId, plan: charge.planRequested };
    }

    /**
     * Proactively sync charge status with AbacatePay API
     */
    static async syncChargeStatus(chargeId: string) {
        const charge = await db.query.billingCharges.findFirst({
            where: eq(billingCharges.id, chargeId)
        });

        if (!charge || charge.status !== 'pending') return;

        try {
            if (!charge.abacatePayId) return;

            const apiStatus = await AbacatePayClient.checkChargeStatus(charge.abacatePayId);

            if (apiStatus && apiStatus.toUpperCase() === 'PAID') {
                await this.confirmPayment(charge.id);
            } else if (apiStatus && ['CANCELLED', 'EXPIRED', 'REFUNDED'].includes(apiStatus.toUpperCase())) {
                await this.failPayment(charge.abacatePayId!, apiStatus.toLowerCase() as any);
            }
        } catch (error: any) {
            logger.error(`[BILLING] Proactive sync failed for ${chargeId}:`, error);
        }
    }

    /**
     * Handle failed/cancelled payments
     */
    static async failPayment(abacatePayId: string, status: 'expired' | 'cancelled' | 'refunded' | 'failed') {
        await db.update(billingCharges)
            .set({ status, updatedAt: new Date() })
            .where(eq(billingCharges.abacatePayId, abacatePayId));

        const charge = await db.query.billingCharges.findFirst({
            where: eq(billingCharges.abacatePayId, abacatePayId)
        });

        if (charge) {
            await db.insert(billingEvents).values({
                tenantId: charge.tenantId,
                chargeId: charge.id,
                type: 'PAYMENT_FAILED',
                payload: { status, reason: 'AbacatePay callback/sync' }
            });
        }

        logger.warn(`[BILLING] Charge ${abacatePayId} moved to status: ${status}`);
    }
}
