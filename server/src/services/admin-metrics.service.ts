import { db } from '../db';
import { tenants, users, tools, customers, rentals, payments } from '../db/schema';
import { eq, count, sql, and, desc, gte, lt } from 'drizzle-orm';
import { getPlanLimits } from '../config/plans';

/**
 * Service dedicated to deep KPIs, Revenue and Activation Metrics for the SaaS
 */
export class AdminMetricsService {

    /**
     * Get global business and revenue overview
     */
    static async getGlobalOverview() {
        // Base counts
        const [totalTenants] = await db.select({ value: count() }).from(tenants);
        const [totalUsers] = await db.select({ value: count() }).from(users);
        const [totalCustomers] = await db.select({ value: count() }).from(customers);
        const [totalTools] = await db.select({ value: count() }).from(tools);
        const [totalRentals] = await db.select({ value: count() }).from(rentals);

        // Account Status
        const [activeAccounts] = await db.select({ value: count() }).from(tenants).where(eq(tenants.subscriptionStatus, 'active'));
        const [trialAccounts] = await db.select({ value: count() }).from(tenants).where(eq(tenants.subscriptionStatus, 'trialing'));
        const [pastDueAccounts] = await db.select({ value: count() }).from(tenants).where(eq(tenants.subscriptionStatus, 'past_due'));
        const [canceledAccounts] = await db.select({ value: count() }).from(tenants).where(eq(tenants.subscriptionStatus, 'canceled'));

        // Revenue (MRR / ARR estimated based on active paid plans)
        const [proCount] = await db.select({ value: count() }).from(tenants).where(and(eq(tenants.plan, 'pro'), eq(tenants.subscriptionStatus, 'active')));
        const [premiumCount] = await db.select({ value: count() }).from(tenants).where(and(eq(tenants.plan, 'premium'), eq(tenants.subscriptionStatus, 'active')));

        const PRO_PRICE = 97;
        const PREMIUM_PRICE = 197;

        const mrr = (proCount.value * PRO_PRICE) + (premiumCount.value * PREMIUM_PRICE);
        const arr = mrr * 12;

        // Actual Processed Revenue (Sum of paid charges)
        const proRevenue = await db.execute(sql`SELECT SUM(amount) as total FROM billing_charges WHERE status = 'paid' AND plan_requested = 'pro'`);
        const premiumRevenue = await db.execute(sql`SELECT SUM(amount) as total FROM billing_charges WHERE status = 'paid' AND plan_requested = 'premium'`);

        return {
            base: {
                tenants: totalTenants.value,
                users: totalUsers.value,
                customers: totalCustomers.value,
                tools: totalTools.value,
                rentals: totalRentals.value
            },
            status: {
                active: activeAccounts.value,
                trialing: trialAccounts.value,
                pastDue: pastDueAccounts.value,
                canceled: canceledAccounts.value
            },
            revenue: {
                mrrEstimado: mrr.toLocaleString('pt-BR'),
                arrEstimado: arr.toLocaleString('pt-BR'),
                averageTicket: (activeAccounts.value > 0 ? (mrr / activeAccounts.value) : 0).toLocaleString('pt-BR'),
                paidAccounts: proCount.value + premiumCount.value,
                revenueByPlan: {
                    pro: Number(proRevenue.rows[0].total || 0).toLocaleString('pt-BR'),
                    premium: Number(premiumRevenue.rows[0].total || 0).toLocaleString('pt-BR')
                }
            }
        };
    }

    /**
     * Get Activation Funnel Metrics
     */
    static async getActivationFunnel() {
        const [totalRegistered] = await db.select({ value: count() }).from(tenants);

        // Onboarding completed (from users table, joining to distinct tenants)
        const onboardedResult = await db.execute(sql`
            SELECT COUNT(DISTINCT tenant_id) as c FROM users WHERE has_onboarded = true
        `);
        const onboardedTenants = Number(onboardedResult.rows[0].c || 0);

        // First tool created
        const firstToolResult = await db.execute(sql`
            SELECT COUNT(DISTINCT tenant_id) as c FROM tools
        `);
        const tenantsWithTools = Number(firstToolResult.rows[0].c || 0);

        // First rental created
        const firstRentalResult = await db.execute(sql`
            SELECT COUNT(DISTINCT tenant_id) as c FROM rentals
        `);
        const tenantsWithRentals = Number(firstRentalResult.rows[0].c || 0);

        return {
            funnel: {
                registered: totalRegistered.value,
                onboarded: onboardedTenants,
                createdTool: tenantsWithTools,
                createdRental: tenantsWithRentals
            },
            conversionRates: {
                registrationToOnboarded: totalRegistered.value > 0 ? (onboardedTenants / totalRegistered.value) * 100 : 0,
                onboardedToRental: onboardedTenants > 0 ? (tenantsWithRentals / onboardedTenants) * 100 : 0
            }
        };
    }
}
