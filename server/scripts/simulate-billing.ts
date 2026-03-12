import { db } from '../src/db';
import { tenants, billingCharges, billingEvents, subscriptions } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { BillingService } from '../src/services/billing/billing.service';
import { SubscriptionLifecycleService } from '../src/services/billing/subscription-lifecycle.service';

/**
 * SIMULATION SCRIPT
 * This script verifies the core logic of the billing system without external dependencies.
 */
async function runSimulation() {
    console.log('🚀 Starting Billing Simulation...');

    // 1. Get a test tenant
    const tenant = await db.query.tenants.findFirst();
    if (!tenant) {
        console.error('❌ No tenant found to simulate.');
        return;
    }
    console.log(`🔹 Simulating for Tenant: ${tenant.name} (${tenant.id})`);

    // 2. Simulate Charge Creation
    console.log('📦 Step 1: Initiating Upgrade...');
    // We mock the service call since it hits AbacatePay API
    // Instead, we manually insert a charge
    const [charge] = await db.insert(billingCharges).values({
        tenantId: tenant.id,
        userId: 'system-sim',
        planRequested: 'pro',
        amount: '97.00',
        status: 'pending',
        abacatePayId: 'sim_' + Date.now(),
        method: 'PIX_QRCODE',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }).returning();
    console.log(`✅ Charge created: ${charge.id}`);

    // 3. Simulate Payment Confirmation (Webhook simulation)
    console.log('💰 Step 2: Confirming Payment...');
    await BillingService.confirmPayment(charge.abacatePayId!);

    // Verify results
    const updatedTenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenant.id) });
    const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.tenantId, tenant.id) });

    console.log(`📈 Tenant Plan: ${updatedTenant?.plan}`);
    console.log(`🔥 Subscription Status: ${sub?.status}`);

    if (updatedTenant?.plan === 'pro' && sub?.status === 'active') {
        console.log('✅ Activation SUCCESSful');
    } else {
        console.error('❌ Activation FAILED');
    }

    // 4. Simulate Expiration
    console.log('⌛ Step 3: Simulating Expiration...');
    if (sub) {
        await SubscriptionLifecycleService.cancelSubscription(sub.id, 'Simulated Expiration');
        const expiredTenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenant.id) });
        console.log(`🔒 Tenant Status after expiration: ${expiredTenant?.subscriptionStatus}`);
        if (expiredTenant?.subscriptionStatus === 'canceled') {
            console.log('✅ Expiration logic SUCCESSful');
        }
    }

    // 5. Check Audit Trail
    const events = await db.query.billingEvents.findMany({
        where: eq(billingEvents.tenantId, tenant.id),
        orderBy: (events, { desc }) => [desc(events.createdAt)],
        limit: 5
    });
    console.log('📜 Last 5 Audit Events:');
    events.forEach(e => console.log(` - [${e.type}] ${JSON.stringify(e.payload)}`));

    console.log('🏁 Simulation Finished.');
}

runSimulation().catch(console.error);
