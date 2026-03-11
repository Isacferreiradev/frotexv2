import { db } from '../db';
import { tools, customers, rentals, tenants, users } from '../db/schema';
import { eq, count, and, desc, ilike, or } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

/**
 * Service dedicated to Master Admin "Deus Mode" actions.
 * Bypasses tenant isolation to list, update, or delete any entity globally.
 */
export class AdminEntitiesService {

    // ==========================================
    // USERS (System Logins)
    // ==========================================

    static async updateUser(id: string, payload: any) {
        const user = await db.query.users.findFirst({ where: eq(users.id, id), with: { tenant: { columns: { id: true, name: true } } } });
        if (!user) throw new AppError(404, 'User not found');

        const [updated] = await db.update(users)
            .set({ ...payload, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();

        logger.warn(`[ADMIN MASTER OVERRIDE] System User ${id} updated for Tenant ${user.tenant?.id} (${user.tenant?.name}) by System Admin. Payload: ${JSON.stringify(payload)}`);

        return updated;
    }

    static async deleteUser(id: string) {
        const user = await db.query.users.findFirst({ where: eq(users.id, id), with: { tenant: { columns: { id: true, name: true } } } });
        if (!user) throw new AppError(404, 'User not found');

        await db.delete(users).where(eq(users.id, id));
        logger.warn(`[ADMIN MASTER OVERRIDE] System User ${id} DELETED from Tenant ${user.tenant?.id} (${user.tenant?.name}) by System Admin.`);

        return { success: true, message: 'User permanently deleted' };
    }

    // ==========================================
    // TOOLS
    // ==========================================

    static async listTools(params: {
        page: number;
        limit: number;
        search?: string;
        tenantId?: string;
        status?: string;
    }) {
        const offset = (params.page - 1) * params.limit;
        const conditions = [];

        if (params.search) {
            conditions.push(or(
                ilike(tools.name, `%${params.search}%`),
                ilike(tools.brand, `%${params.search}%`),
                ilike(tools.serialNumber, `%${params.search}%`)
            ));
        }
        if (params.tenantId) {
            conditions.push(eq(tools.tenantId, params.tenantId));
        }
        if (params.status) {
            conditions.push(eq(tools.status, params.status as any));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db.query.tools.findMany({
            where: whereClause,
            orderBy: [desc(tools.createdAt)],
            limit: params.limit,
            offset: offset,
            with: {
                tenant: { columns: { id: true, name: true } }
            }
        });

        const [totalCount] = await db.select({ value: count() }).from(tools).where(whereClause);

        return { data: rows, total: totalCount.value };
    }

    static async updateTool(id: string, payload: any) {
        const tool = await db.query.tools.findFirst({ where: eq(tools.id, id), with: { tenant: { columns: { id: true, name: true } } } });
        if (!tool) throw new AppError(404, 'Tool not found');

        const [updated] = await db.update(tools)
            .set({ ...payload, updatedAt: new Date() })
            .where(eq(tools.id, id))
            .returning();

        logger.warn(`[ADMIN MASTER OVERRIDE] Tool ${id} updated for Tenant ${tool.tenant?.id} (${tool.tenant?.name}) by System Admin. Payload: ${JSON.stringify(payload)}`);

        return updated;
    }

    static async deleteTool(id: string) {
        const tool = await db.query.tools.findFirst({ where: eq(tools.id, id), with: { tenant: { columns: { id: true, name: true } } } });
        if (!tool) throw new AppError(404, 'Tool not found');

        await db.delete(tools).where(eq(tools.id, id));
        logger.warn(`[ADMIN MASTER OVERRIDE] Tool ${id} DELETED from Tenant ${tool.tenant?.id} (${tool.tenant?.name}) by System Admin.`);

        return { success: true, message: 'Tool permanently deleted' };
    }

    // ==========================================
    // CUSTOMERS
    // ==========================================

    static async listCustomers(params: {
        page: number;
        limit: number;
        search?: string;
        tenantId?: string;
    }) {
        const offset = (params.page - 1) * params.limit;
        const conditions = [];

        if (params.search) {
            conditions.push(or(
                ilike(customers.fullName, `%${params.search}%`),
                ilike(customers.documentNumber, `%${params.search}%`),
                ilike(customers.email, `%${params.search}%`)
            ));
        }
        if (params.tenantId) {
            conditions.push(eq(customers.tenantId, params.tenantId));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db.query.customers.findMany({
            where: whereClause,
            orderBy: [desc(customers.createdAt)],
            limit: params.limit,
            offset: offset,
            with: {
                tenant: { columns: { id: true, name: true } }
            }
        });

        const [totalCount] = await db.select({ value: count() }).from(customers).where(whereClause);

        return { data: rows, total: totalCount.value };
    }

    static async updateCustomer(id: string, payload: any) {
        const customer = await db.query.customers.findFirst({ where: eq(customers.id, id), with: { tenant: true } });
        if (!customer) throw new AppError(404, 'Customer not found');

        const [updated] = await db.update(customers)
            .set({ ...payload, updatedAt: new Date() })
            .where(eq(customers.id, id))
            .returning();

        logger.warn(`[ADMIN MASTER OVERRIDE] Customer ${id} updated for Tenant ${customer.tenant?.id} (${customer.tenant?.name}) by System Admin.`);
        return updated;
    }

    static async deleteCustomer(id: string) {
        const customer = await db.query.customers.findFirst({ where: eq(customers.id, id), with: { tenant: true } });
        if (!customer) throw new AppError(404, 'Customer not found');

        await db.delete(customers).where(eq(customers.id, id));
        logger.warn(`[ADMIN MASTER OVERRIDE] Customer ${id} DELETED from Tenant ${customer.tenant?.id} (${customer.tenant?.name}) by System Admin.`);

        return { success: true, message: 'Customer permanently deleted' };
    }

    // ==========================================
    // RENTALS
    // ==========================================

    static async listRentals(params: {
        page: number;
        limit: number;
        search?: string;
        tenantId?: string;
        status?: string;
    }) {
        const offset = (params.page - 1) * params.limit;
        const conditions = [];

        if (params.search) {
            conditions.push(ilike(rentals.rentalCode, `%${params.search}%`));
        }
        if (params.tenantId) {
            conditions.push(eq(rentals.tenantId, params.tenantId));
        }
        if (params.status) {
            conditions.push(eq(rentals.status, params.status as any));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const rows = await db.query.rentals.findMany({
            where: whereClause,
            orderBy: [desc(rentals.createdAt)],
            limit: params.limit,
            offset: offset,
            with: {
                tenant: { columns: { id: true, name: true } },
                tool: { columns: { id: true, name: true } },
                customer: { columns: { id: true, fullName: true } }
            }
        });

        const [totalCount] = await db.select({ value: count() }).from(rentals).where(whereClause);

        return { data: rows, total: totalCount.value };
    }

    static async updateRental(id: string, payload: any) {
        const rental = await db.query.rentals.findFirst({ where: eq(rentals.id, id), with: { tenant: true } });
        if (!rental) throw new AppError(404, 'Rental not found');

        // Note: For complex rental state changes, we just do a raw update via Deus Mode.
        // It's the Caller's responsibility to keep it sound.
        const [updated] = await db.update(rentals)
            .set({ ...payload, updatedAt: new Date() })
            .where(eq(rentals.id, id))
            .returning();

        logger.warn(`[ADMIN MASTER OVERRIDE] Rental ${id} updated for Tenant ${rental.tenant?.id} (${rental.tenant?.name}) by System Admin.`);
        return updated;
    }

    static async deleteRental(id: string) {
        const rental = await db.query.rentals.findFirst({ where: eq(rentals.id, id), with: { tenant: true } });
        if (!rental) throw new AppError(404, 'Rental not found');

        await db.delete(rentals).where(eq(rentals.id, id));
        logger.warn(`[ADMIN MASTER OVERRIDE] Rental ${id} DELETED from Tenant ${rental.tenant?.id} (${rental.tenant?.name}) by System Admin.`);

        return { success: true, message: 'Rental permanently deleted' };
    }
}
