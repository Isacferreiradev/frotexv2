import { eq, and, count, gte } from 'drizzle-orm';
import { db } from '../db';
import { tenants, tools, customers, rentals, users } from '../db/schema';
import { getPlanLimits, PLANS, PlanLimits } from '../config/plans';

// ============================================================
//  Types
// ============================================================

export type SubscriptionStatus =
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'paused'
    | 'expired'
    | 'failed'
    | 'pending_payment';

export interface UsageStats {
    tools: { used: number; limit: number; pct: number };
    customers: { used: number; limit: number; pct: number };
    users: { used: number; limit: number; pct: number };
    rentalsThisMonth: { used: number; limit: number; pct: number };
}

export interface SubscriptionState {
    plan: string;
    status: SubscriptionStatus;
    isTrial: boolean;
    trialEndsAt: Date | null;
    subscriptionEndsAt: Date | null;
    isLocked: boolean;
    lockReason: string | null;
    features: PlanLimits['features'];
    limits: Omit<PlanLimits, 'features'>;
    usage: UsageStats;
    needsUpgrade: boolean;
    blockedResources: string[];
}

// ============================================================
//  Helpers
// ============================================================

function pct(used: number, limit: number): number {
    if (limit >= 9999) return 0; // unlimited
    return Math.round((used / limit) * 100);
}

function isEffectivelyActive(status: SubscriptionStatus, plan: string): boolean {
    if (plan === 'free') return true; // free is always active
    return status === 'active' || status === 'trialing';
}

// ============================================================
//  Core Service
// ============================================================

/**
 * Gets the full subscription state for a tenant.
 * This is the central source of truth for plan/permission checks.
 */
export async function getSubscriptionState(tenantId: string): Promise<SubscriptionState> {
    const [tenant] = await db
        .select({
            plan: tenants.plan,
            subscriptionStatus: tenants.subscriptionStatus,
            trialEndsAt: tenants.trialEndsAt,
            subscriptionEndsAt: tenants.subscriptionEndsAt,
            isManualLock: tenants.isManualLock,
            lockReason: tenants.lockReason,
        })
        .from(tenants)
        .where(eq(tenants.id, tenantId));

    if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

    const planName = tenant.plan || 'free';
    const planLimits = getPlanLimits(planName);
    const status = (tenant.subscriptionStatus || 'active') as SubscriptionStatus;

    const now = new Date();
    const isTrial = status === 'trialing' && tenant.trialEndsAt != null && tenant.trialEndsAt > now;
    const isLocked =
        tenant.isManualLock ||
        status === 'canceled' ||
        status === 'unpaid' ||
        status === 'expired' ||
        status === 'failed' ||
        (status === 'past_due' && planName !== 'free');

    // Usage counts in parallel
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [[toolCount], [custCount], [userCount], [rentalCount]] = await Promise.all([
        db.select({ count: count() }).from(tools).where(eq(tools.tenantId, tenantId)),
        db.select({ count: count() }).from(customers).where(eq(customers.tenantId, tenantId)),
        db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId)),
        db
            .select({ count: count() })
            .from(rentals)
            .where(
                and(
                    eq(rentals.tenantId, tenantId),
                    gte(rentals.createdAt, startOfMonth)
                )
            ),
    ]);

    const usage: UsageStats = {
        tools: {
            used: Number(toolCount.count),
            limit: planLimits.maxTools,
            pct: pct(Number(toolCount.count), planLimits.maxTools),
        },
        customers: {
            used: Number(custCount.count),
            limit: planLimits.maxCustomers,
            pct: pct(Number(custCount.count), planLimits.maxCustomers),
        },
        users: {
            used: Number(userCount.count),
            limit: planLimits.maxUsers,
            pct: pct(Number(userCount.count), planLimits.maxUsers),
        },
        rentalsThisMonth: {
            used: Number(rentalCount.count),
            limit: planLimits.maxRentalsPerMonth,
            pct: pct(Number(rentalCount.count), planLimits.maxRentalsPerMonth),
        },
    };

    const blockedResources: string[] = [];
    if (usage.tools.used >= planLimits.maxTools) blockedResources.push('tools');
    if (usage.customers.used >= planLimits.maxCustomers) blockedResources.push('customers');
    if (usage.users.used >= planLimits.maxUsers) blockedResources.push('users');
    if (usage.rentalsThisMonth.used >= planLimits.maxRentalsPerMonth) blockedResources.push('rentals');

    // Block ALL resources if account is locked
    if (isLocked) {
        blockedResources.push('tools', 'customers', 'rentals', 'users', 'all');
    }

    return {
        plan: planName,
        status,
        isTrial,
        trialEndsAt: tenant.trialEndsAt,
        subscriptionEndsAt: tenant.subscriptionEndsAt,
        isLocked,
        lockReason: tenant.lockReason,
        features: planLimits.features,
        limits: {
            maxUsers: planLimits.maxUsers,
            maxTools: planLimits.maxTools,
            maxCustomers: planLimits.maxCustomers,
            maxRentalsPerMonth: planLimits.maxRentalsPerMonth,
        },
        usage,
        needsUpgrade: blockedResources.length > 0,
        blockedResources,
    };
}

/**
 * Checks if a tenant has reached the limit for a given resource.
 * Returns an object with `allowed` flag and a user-friendly `reason`.
 */
export async function checkLimit(
    tenantId: string,
    resource: 'tools' | 'customers' | 'rentals' | 'users'
): Promise<{ allowed: boolean; reason?: string; code?: string }> {
    const [tenant] = await db
        .select({ plan: tenants.plan, subscriptionStatus: tenants.subscriptionStatus, isManualLock: tenants.isManualLock })
        .from(tenants)
        .where(eq(tenants.id, tenantId));

    if (!tenant) return { allowed: false, reason: 'Empresa não encontrada', code: 'TENANT_NOT_FOUND' };

    // Manual lock overrides everything
    if (tenant.isManualLock) {
        return { allowed: false, reason: 'Sua conta está bloqueada. Entre em contato com o suporte.', code: 'ACCOUNT_LOCKED' };
    }

    // Global lock for non-free plans with bad status
    const badStatuses = ['canceled', 'unpaid'];
    if (tenant.plan !== 'free' && badStatuses.includes(tenant.subscriptionStatus || '')) {
        return {
            allowed: false,
            reason: 'Sua assinatura está inativa. Regularize para continuar usando o sistema.',
            code: 'SUBSCRIPTION_INACTIVE',
        };
    }

    const limits = getPlanLimits(tenant.plan);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let currentCount = 0;
    let maxAllowed = 0;
    let resourceName = '';

    switch (resource) {
        case 'tools':
            [[{ count: currentCount }]] = [await db.select({ count: count() }).from(tools).where(eq(tools.tenantId, tenantId))];
            maxAllowed = limits.maxTools;
            resourceName = 'equipamentos';
            break;
        case 'customers':
            [[{ count: currentCount }]] = [await db.select({ count: count() }).from(customers).where(eq(customers.tenantId, tenantId))];
            maxAllowed = limits.maxCustomers;
            resourceName = 'clientes';
            break;
        case 'rentals':
            [[{ count: currentCount }]] = [
                await db.select({ count: count() }).from(rentals).where(and(eq(rentals.tenantId, tenantId), gte(rentals.createdAt, startOfMonth))),
            ];
            maxAllowed = limits.maxRentalsPerMonth;
            resourceName = 'locações este mês';
            break;
        case 'users':
            [[{ count: currentCount }]] = [await db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId))];
            maxAllowed = limits.maxUsers;
            resourceName = 'usuários';
            break;
    }

    const numericCount = Number(currentCount);
    if (numericCount >= maxAllowed) {
        const planLabel = tenant.plan === 'free' ? 'Free' : tenant.plan === 'pro' ? 'Pro' : 'Premium';
        return {
            allowed: false,
            code: 'LIMIT_REACHED',
            reason: `Limite de ${resourceName} atingido no plano ${planLabel} (${maxAllowed} itens). Faça upgrade para continuar.`,
        };
    }

    return { allowed: true };
}

/**
 * Checks if the tenant's plan includes a specific feature.
 */
export async function hasFeature(
    tenantId: string,
    feature: keyof PlanLimits['features']
): Promise<{ allowed: boolean; reason?: string; code?: string }> {
    const [tenant] = await db
        .select({ plan: tenants.plan, subscriptionStatus: tenants.subscriptionStatus, isManualLock: tenants.isManualLock })
        .from(tenants)
        .where(eq(tenants.id, tenantId));

    if (!tenant) return { allowed: false, reason: 'Empresa não encontrada', code: 'TENANT_NOT_FOUND' };

    if (tenant.isManualLock) {
        return { allowed: false, reason: 'Sua conta está bloqueada.', code: 'ACCOUNT_LOCKED' };
    }

    const limits = getPlanLimits(tenant.plan);
    const allowed = limits.features[feature] === true;

    if (!allowed) {
        const planLabel = tenant.plan === 'free' ? 'Free' : tenant.plan === 'pro' ? 'Pro' : 'Premium';
        return {
            allowed: false,
            code: 'FEATURE_NOT_AVAILABLE',
            reason: `Seu plano ${planLabel} não permite acessar este recurso. Faça upgrade para liberar esta funcionalidade.`,
        };
    }

    return { allowed: true };
}
