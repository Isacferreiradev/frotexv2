import Stripe from 'stripe';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';

// Ensure we have a string that Stripe constructor accepts, even if it's a dummy one for boot
const getInitialKey = () => {
    const key = env.STRIPE_SECRET_KEY;
    if (!key || key === 'sk_test_placeholder') return 'sk_test_dummy_key_to_prevent_server_crash_during_boot';
    return key;
};

const stripe = new Stripe(getInitialKey(), {
    apiVersion: '2025-01-27' as any,
});

export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free',
        equipmentLimit: 10,
        userLimit: 1,
        price: 0,
    },
    PRO: {
        id: 'pro',
        name: 'Pro',
        priceId: env.STRIPE_PRICE_PRO_ID!,
        equipmentLimit: Infinity,
        userLimit: 3,
        price: 97,
    },
    SCALE: {
        id: 'scale',
        name: 'Scale',
        priceId: env.STRIPE_PRICE_SCALE_ID!,
        equipmentLimit: Infinity,
        userLimit: Infinity,
        price: 197,
    },
};

export async function createCheckoutSession(tenantId: string, email: string, priceId: string) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${env.CORS_ORIGIN}/dashboard?payment=success`,
            cancel_url: `${env.CORS_ORIGIN}/dashboard?payment=cancelled`,
            client_reference_id: tenantId,
            customer_email: email,
            subscription_data: {
                metadata: { tenantId },
            },
        });

        return { url: session.url };
    } catch (error: any) {
        throw new AppError(500, `Stripe Error: ${error.message}`);
    }
}

export async function createPortalSession(customerId: string) {
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${env.CORS_ORIGIN}/configuracoes`,
        });
        return { url: session.url };
    } catch (error: any) {
        throw new AppError(500, `Stripe Portal Error: ${error.message}`);
    }
}

export const constructEvent = (payload: string | Buffer, sig: string) => {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    return stripe.webhooks.constructEvent(payload, sig, env.STRIPE_WEBHOOK_SECRET!);
};
