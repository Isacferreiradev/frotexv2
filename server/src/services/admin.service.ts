import { db } from '../db';
import { tenants, users, tools, customers, rentals, payments } from '../db/schema';
import { eq, count, sql, and, desc, ilike, or } from 'drizzle-orm';
import { getPlanLimits } from '../config/plans';
import { AppError } from '../middleware/error.middleware';

/**
 * Service for Global SaaS Administrative Metrics
 */
export async function getSaaSOverview() {
    const [tenantsCount] = await db.select({ value: count() }).from(tenants);
    const [usersCount] = await db.select({ value: count() }).from(users);
    const [customersCount] = await db.select({ value: count() }).from(customers);
    const [toolsCount] = await db.select({ value: count() }).from(tools);
    const [rentalsCount] = await db.select({ value: count() }).from(rentals);

    // Filtered Tenant counts
    const [freeTenants] = await db.select({ value: count() }).from(tenants).where(eq(tenants.plan, 'free'));
    const [paidTenants] = await db.select({ value: count() }).from(tenants).where(sql`${tenants.plan} != 'free'`);

    // Revenue placeholder (Sum of all completed payments)
    const [totalRevenue] = await db.select({ value: sql<string>`sum(${payments.amount})` })
        .from(payments)
        .where(eq(payments.status, 'completed'));

    // MRR Calculation (Estimated based on paid plants)
    // Scale: Assume R$ 499, Pro: Assume R$ 199
    const [proCount] = await db.select({ value: count() }).from(tenants).where(eq(tenants.plan, 'pro'));
    const [scaleCount] = await db.select({ value: count() }).from(tenants).where(eq(tenants.plan, 'scale'));
    const estimatedMRR = (proCount.value * 199) + (scaleCount.value * 499);

    return {
        totals: {
            tenants: tenantsCount.value,
            users: usersCount.value,
            customers: customersCount.value,
            tools: toolsCount.value,
            rentals: rentalsCount.value,
        },
        business: {
            freeTenants: freeTenants.value,
            paidTenants: paidTenants.value,
            conversionRate: paidTenants.value / (tenantsCount.value || 1),
            totalRevenue: parseFloat(totalRevenue.value || '0'),
            estimatedMRR: estimatedMRR
        }
    };
}

/**
 * List all tenants with filters and pagination
 */
export async function listTenants(params: {
    page: number;
    limit: number;
    search?: string;
    plan?: string;
}) {
    const offset = (params.page - 1) * params.limit;

    let whereClause = undefined;
    if (params.search || params.plan) {
        const conditions = [];
        if (params.search) {
            conditions.push(or(
                ilike(tenants.name, `%${params.search}%`),
                ilike(tenants.contactEmail, `%${params.search}%`)
            ));
        }
        if (params.plan) {
            conditions.push(eq(tenants.plan, params.plan as any));
        }
        whereClause = and(...(conditions as any));
    }

    const rows = await db.query.tenants.findMany({
        where: whereClause,
        orderBy: [desc(tenants.createdAt)],
        limit: params.limit,
        offset: offset,
        with: {
            users: { columns: { id: true } },
            customers: { columns: { id: true } },
            tools: { columns: { id: true } },
            rentals: { columns: { id: true } },
        }
    });

    const [totalCount] = await db.select({ value: count() }).from(tenants).where(whereClause);

    const data = rows.map(t => ({
        ...t,
        stats: {
            usersCount: t.users?.length || 0,
            customersCount: t.customers?.length || 0,
            toolsCount: t.tools?.length || 0,
            rentalsCount: t.rentals?.length || 0,
        }
    }));

    return { data, total: totalCount.value };
}

/**
 * Get deep details of a single tenant plus usage against limits
 */
export async function getTenantAdminDetails(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        with: {
            users: true,
            customers: { limit: 5, orderBy: [desc(customers.createdAt)] },
            rentals: { limit: 5, orderBy: [desc(rentals.startDate)] }
        }
    });

    if (!tenant) throw new AppError(404, 'Tenant not found');

    const [toolsCount] = await db.select({ value: count() }).from(tools).where(eq(tools.tenantId, tenantId));
    const [customersCount] = await db.select({ value: count() }).from(customers).where(eq(customers.tenantId, tenantId));
    const [usersCount] = await db.select({ value: count() }).from(users).where(eq(users.tenantId, tenantId));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [rentalsThisMonth] = await db.select({ value: count() })
        .from(rentals)
        .where(and(eq(rentals.tenantId, tenantId), sql`${rentals.createdAt} >= ${startOfMonth}`));

    const limits = getPlanLimits(tenant.plan);

    const usage = {
        users: { used: usersCount.value, limit: limits.maxUsers, pct: (usersCount.value / limits.maxUsers) * 100 },
        tools: { used: toolsCount.value, limit: limits.maxTools, pct: (toolsCount.value / limits.maxTools) * 100 },
        customers: { used: customersCount.value, limit: limits.maxCustomers, pct: (customersCount.value / limits.maxCustomers) * 100 },
        rentalsMonthly: { used: rentalsThisMonth.value, limit: limits.maxRentalsPerMonth, pct: (rentalsThisMonth.value / limits.maxRentalsPerMonth) * 100 },
    };

    return {
        ...tenant,
        usage,
        limits,
        canUpgrade: Object.values(usage).some(u => u.pct > 80)
    };
}
