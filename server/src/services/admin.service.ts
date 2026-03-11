import { db } from '../db';
import { tenants, users, tools, customers, rentals, billingCharges } from '../db/schema';
import { eq, count, sql, and, desc, asc, ilike, or } from 'drizzle-orm';
import { getPlanLimits } from '../config/plans';
import { AppError } from '../middleware/error.middleware';

/**
 * Service for managing overarching admin data (Tenants, Users, Subscriptions)
 */
export class AdminDataService {

    /**
     * List all tenants with advanced filters, sorting and pagination
     */
    static async listTenants(params: {
        page: number;
        limit: number;
        search?: string;
        plan?: string;
        status?: string;
        sort?: string;
        sortDirection?: 'asc' | 'desc';
    }) {
        const offset = (params.page - 1) * params.limit;

        const conditions = [];

        if (params.search) {
            conditions.push(or(
                ilike(tenants.name, `%${params.search}%`),
                ilike(tenants.contactEmail, `%${params.search}%`),
                ilike(tenants.cnpj, `%${params.search}%`)
            ));
        }

        if (params.plan) {
            conditions.push(eq(tenants.plan, params.plan as any));
        }

        if (params.status) {
            conditions.push(eq(tenants.subscriptionStatus, params.status as any));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Sorting logic
        let orderByClause = desc(tenants.createdAt);
        if (params.sort === 'name') {
            orderByClause = params.sortDirection === 'asc' ? asc(tenants.name) : desc(tenants.name);
        } else if (params.sort === 'plan') {
            orderByClause = params.sortDirection === 'asc' ? asc(tenants.plan) : desc(tenants.plan);
        }

        const rows = await db.query.tenants.findMany({
            where: whereClause,
            orderBy: [orderByClause],
            limit: params.limit,
            offset: offset,
            with: {
                users: { columns: { id: true, lastActiveAt: true } },
                customers: { columns: { id: true } },
                tools: { columns: { id: true } },
                rentals: { columns: { id: true } },
            }
        });

        const [totalCount] = await db.select({ value: count() }).from(tenants).where(whereClause);

        const data = rows.map(t => {
            const usersCount = t.users?.length || 0;
            const toolsCount = t.tools?.length || 0;
            const rentalsCount = t.rentals?.length || 0;
            const customersCount = t.customers?.length || 0;

            // Heuristics
            const limits = getPlanLimits(t.plan);
            const toolsPct = limits.maxTools > 0 ? (toolsCount / limits.maxTools) * 100 : 0;
            const customersPct = limits.maxCustomers > 0 ? (customersCount / limits.maxCustomers) * 100 : 0;

            const upgradePotential = (toolsPct > 80 || customersPct > 80) && t.plan !== 'premium';
            const churnRisk = (t.plan !== 'free' && rentalsCount === 0 && t.subscriptionStatus === 'active');

            return {
                id: t.id,
                name: t.name,
                email: t.contactEmail,
                document: t.cnpj,
                plan: t.plan,
                status: t.subscriptionStatus,
                isManualLock: t.isManualLock,
                createdAt: t.createdAt,
                stats: {
                    usersCount,
                    customersCount,
                    toolsCount,
                    rentalsCount,
                },
                insights: {
                    upgradePotential,
                    churnRisk,
                    usagePercentMax: Math.max(toolsPct, customersPct)
                }
            };
        });

        return { data, total: totalCount.value };
    }

    /**
     * Get deep details (360 view) of a single tenant plus usage against limits
     */
    static async getTenantAdminDetails(tenantId: string) {
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            with: {
                users: true,
                customers: { limit: 10, orderBy: [desc(customers.createdAt)] },
                rentals: { limit: 10, orderBy: [desc(rentals.startDate)] },
                billingCharges: { orderBy: [desc(billingCharges.createdAt)] }
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
            users: { used: usersCount.value, limit: limits.maxUsers, pct: limits.maxUsers > 0 ? (usersCount.value / limits.maxUsers) * 100 : 0 },
            tools: { used: toolsCount.value, limit: limits.maxTools, pct: limits.maxTools > 0 ? (toolsCount.value / limits.maxTools) * 100 : 0 },
            customers: { used: customersCount.value, limit: limits.maxCustomers, pct: limits.maxCustomers > 0 ? (customersCount.value / limits.maxCustomers) * 100 : 0 },
            rentalsMonthly: { used: rentalsThisMonth.value, limit: limits.maxRentalsPerMonth, pct: limits.maxRentalsPerMonth > 0 ? (rentalsThisMonth.value / limits.maxRentalsPerMonth) * 100 : 0 },
        };

        const isAtLimit = Object.values(usage).some(u => u.pct >= 100);
        const canUpgrade = Object.values(usage).some(u => u.pct > 80) && tenant.plan !== 'premium';
        const isZombie = (toolsCount.value === 0 && customersCount.value === 0);

        return {
            tenant: {
                id: tenant.id,
                name: tenant.name,
                email: tenant.contactEmail,
                document: tenant.cnpj,
                phone: tenant.phoneNumber,
                createdAt: tenant.createdAt,
                plan: tenant.plan,
                status: tenant.subscriptionStatus,
                trialEndsAt: tenant.trialEndsAt,
                subscriptionEndsAt: tenant.subscriptionEndsAt,
                isManualLock: tenant.isManualLock,
                lockReason: tenant.lockReason
            },
            usage,
            limits,
            insights: {
                isAtLimit,
                canUpgrade,
                isZombie
            },
            recentUsers: tenant.users,
            recentCustomers: tenant.customers,
            recentRentals: tenant.rentals
        };
    }

    /**
     * List all Users across the entire SaaS, with tenant info
     */
    static async listUsers(params: {
        page: number;
        limit: number;
        search?: string;
    }) {
        const offset = (params.page - 1) * params.limit;
        const conditions = [];

        if (params.search) {
            conditions.push(or(
                ilike(users.fullName, `%${params.search}%`),
                ilike(users.email, `%${params.search}%`)
            ));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db.query.users.findMany({
            where: whereClause,
            orderBy: [desc(users.createdAt)],
            limit: params.limit,
            offset: offset,
            with: {
                tenant: { columns: { id: true, name: true, plan: true } }
            }
        });

        const [totalCount] = await db.select({ value: count() }).from(users).where(whereClause);

        const data = rows.map(u => ({
            id: u.id,
            name: u.fullName,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            hasOnboarded: u.hasOnboarded,
            lastLoginAt: u.lastLoginAt,
            createdAt: u.createdAt,
            tenant: u.tenant ? {
                id: u.tenant.id,
                name: u.tenant.name,
                plan: u.tenant.plan
            } : null
        }));

        return { data, total: totalCount.value };
    }

    /**
     * List all distinct subscription profiles across the SaaS
     */
    static async listSubscriptions(params: {
        page: number;
        limit: number;
        plan?: string;
        status?: string;
    }) {
        const offset = (params.page - 1) * params.limit;
        const conditions = [];

        if (params.plan) {
            conditions.push(eq(tenants.plan, params.plan as any));
        }
        if (params.status) {
            conditions.push(eq(tenants.subscriptionStatus, params.status as any));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Subscriptions are bounded to Tenants in Locattus architecture
        const rows = await db.query.tenants.findMany({
            where: whereClause,
            orderBy: [desc(tenants.createdAt)],
            limit: params.limit,
            offset: offset
        });

        const [totalCount] = await db.select({ value: count() }).from(tenants).where(whereClause);

        const data = rows.map(t => ({
            id: t.id,
            tenantName: t.name,
            plan: t.plan,
            status: t.subscriptionStatus,
            trialEndsAt: t.trialEndsAt,
            subscriptionEndsAt: t.subscriptionEndsAt,
            isManualLock: t.isManualLock,
            createdAt: t.createdAt
        }));

        return { data, total: totalCount.value };
    }
}
