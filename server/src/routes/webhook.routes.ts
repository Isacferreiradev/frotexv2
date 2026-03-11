import { Router } from 'express';
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
        const querySecret = req.query.secret as string;

        // 1. Basic Secret Check (from query)
        if (querySecret !== env.ABACATE_PAY_WEBHOOK_SECRET) {
            logger.warn(`[WEBHOOK] Unauthorized webhook attempt (invalid query secret).`);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 2. HMAC Signature Validation
        const rawBody = JSON.stringify(req.body);
        if (!AbacatePayClient.validateSignature(rawBody, signature)) {
            logger.warn(`[WEBHOOK] Invalid HMAC signature detected.`);
            return res.status(403).json({ error: 'Invalid signature' });
        }

        const { event, data } = req.body;
        logger.info(`[WEBHOOK] Received event: ${event} for ID: ${data?.id}`);

        // 3. Process Events
        switch (event) {
            case 'transparent.completed':
                await BillingService.confirmPayment(data.id);
                break;

            case 'transparent.expired':
                await BillingService.failPayment(data.id, 'expired');
                break;

            case 'transparent.cancelled':
                await BillingService.failPayment(data.id, 'cancelled');
                break;

            case 'transparent.refunded':
                await BillingService.failPayment(data.id, 'refunded');
                break;

            default:
                logger.info(`[WEBHOOK] Unhandled event type: ${event}`);
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error(`[WEBHOOK] Error processing AbacatePay webhook: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
