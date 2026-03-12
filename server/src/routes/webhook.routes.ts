import { Router } from 'express';
import { db } from '../db';
import { billingEvents, billingCharges } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { BillingService } from '../services/billing/billing.service';
import { AbacatePayClient } from '../services/billing/abacatepay.service';
import logger from '../utils/logger';
import { env } from '../config/env';

const router = Router();

/**
 * POST /api/webhooks/abacatepay
 * Public endpoint for AbacatePay notifications
 */
router.post('/abacatepay', async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'] as string;
        const rawBody = (req as any).rawBody
            ? (req as any).rawBody.toString('utf8')
            : JSON.stringify(req.body);

        // 1. Strict Validation
        if (!signature || !AbacatePayClient.validateSignature(rawBody, signature)) {
            logger.warn('[WEBHOOK] Unauthorized or invalid signature from AbacatePay');
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { event, data } = req.body;
        const abacateId = data?.id;

        if (!abacateId) {
            return res.status(400).json({ error: 'Missing data ID' });
        }

        // 2. Idempotency Check
        // Check if the charge itself is already in the target status
        const charge = await db.query.billingCharges.findFirst({
            where: eq(billingCharges.abacatePayId, abacateId)
        });

        if (charge && ((event.includes('paid') && charge.status === 'paid') || (event.includes('refunded') && charge.status === 'refunded'))) {
            logger.info(`[WEBHOOK] Event ${event} for ${abacateId} already processed. Skipping.`);
            return res.status(200).json({ success: true, message: 'Already processed' });
        }

        logger.info(`[WEBHOOK] Verified & Processing: ${event} (${abacateId})`);

        // 3. Process Events
        switch (event) {
            case 'billing.paid':
            case 'checkout.completed':
            case 'transparent.completed':
                await BillingService.confirmPayment(abacateId);
                break;

            case 'billing.failed':
            case 'checkout.expired':
            case 'checkout.cancelled':
            case 'transparent.expired':
                const status = event.includes('expired') ? 'expired' : 'cancelled';
                await BillingService.failPayment(abacateId, status);
                break;

            case 'billing.refunded':
            case 'checkout.refunded':
                await BillingService.failPayment(abacateId, 'refunded');
                break;

            default:
                logger.debug(`[WEBHOOK] Unhandled event type: ${event}`);
        }

        res.status(200).json({ success: true });
    } catch (error: any) {
        logger.error(`[WEBHOOK] Error processing AbacatePay webhook: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
