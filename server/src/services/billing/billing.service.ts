import { db } from '../../db';
import { tenants, billingCharges } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AbacatePayClient } from './abacatepay.service';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';

export class BillingService {
    /**
     * Initiate an upgrade path for a tenant
     */
    static async initiateUpgrade(tenantId: string, userId: string, plan: 'pro' | 'premium' | 'scale') {
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
            amount,
            method: 'PIX_QRCODE',
            externalId: tenantId, // Using tenantId as external reference
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

        logger.info(`[BILLING] Charge ${charge.id} initiated for Tenant ${tenantId} (${targetPlan})`);

        return charge;
    }

    /**
     * Confirm a payment and release the plan features
     */
    static async confirmPayment(abacatePayId: string) {
        const charge = await db.query.billingCharges.findFirst({
            where: eq(billingCharges.abacatePayId, abacatePayId)
        });

        if (!charge) {
            logger.error(`[BILLING] Received payment for unknown charge ID: ${abacatePayId}`);
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

        // 2. Update Tenant Plan & Status
        await db.update(tenants)
            .set({
                plan: charge.planRequested as any,
                subscriptionStatus: 'active',
                updatedAt: new Date(),
                // If it's a new subscription, we might want to set subscription_ends_at to 1 month from now
                subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            })
            .where(eq(tenants.id, charge.tenantId));

        logger.info(`[BILLING] SUCCESS: Tenant ${charge.tenantId} upgraded to ${charge.planRequested} via Charge ${charge.id}`);

        return { success: true, tenantId: charge.tenantId, plan: charge.planRequested };
    }

    /**
     * Handle failed/cancelled payments
     */
    static async failPayment(abacatePayId: string, status: 'expired' | 'cancelled' | 'refunded') {
        await db.update(billingCharges)
            .set({ status, updatedAt: new Date() })
            .where(eq(billingCharges.abacatePayId, abacatePayId));

        logger.warn(`[BILLING] Charge ${abacatePayId} moved to status: ${status}`);
    }
}
