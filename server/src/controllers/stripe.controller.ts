import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import * as stripeService from '../services/stripe.service';
import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
        const { priceId } = req.body;
        const tenantId = req.user?.tenantId;
        const email = req.user?.email;

        if (!tenantId || !email) throw new Error('Tenant missing');

        const { url } = await stripeService.createCheckoutSession(tenantId, email, priceId);
        res.json({ success: true, data: { url } });
    } catch (err) { next(err); }
}

export async function stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
        event = stripeService.constructEvent(req.body, sig);
    } catch (err: any) {
        logger.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as any;
            const tenantId = session.client_reference_id;
            const customerId = session.customer;

            // Map Price ID to Plan Level
            let plan = 'free';
            const priceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId;

            if (priceId === env.STRIPE_PRICE_PRO_ID) plan = 'pro';
            else if (priceId === env.STRIPE_PRICE_SCALE_ID) plan = 'scale';

            await db.update(tenants)
                .set({
                    plan: plan as any,
                    stripeCustomerId: customerId,
                    updatedAt: new Date()
                })
                .where(eq(tenants.id, tenantId));

            logger.info(`Plan updated for tenant ${tenantId} to ${plan}`);
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as any;
            const customerId = subscription.customer;

            await db.update(tenants)
                .set({ plan: 'free', updatedAt: new Date() })
                .where(eq(tenants.stripeCustomerId, customerId));

            logger.info(`Subscription cancelled for customer ${customerId}`);
            break;
        }
    }

    res.json({ received: true });
}
