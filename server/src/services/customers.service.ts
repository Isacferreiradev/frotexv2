import { db } from '../db';
import { customers } from '../db/schema';
import { eq, and, or, ilike, SQL, desc, isNull } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import logger from '../utils/logger';

const SAFE_CUSTOMER_COLUMNS = {
    id: customers.id,
    tenantId: customers.tenantId,
    fullName: customers.fullName,
    documentType: customers.documentType,
    documentNumber: customers.documentNumber,
    phoneNumber: customers.phoneNumber,
    email: customers.email,
    addressStreet: customers.addressStreet,
    addressNumber: customers.addressNumber,
    addressCity: customers.addressCity,
    addressState: customers.addressState,
    isBlocked: customers.isBlocked,
    creditLimit: customers.creditLimit,
    allowLateRentals: customers.allowLateRentals,
    createdAt: customers.createdAt,
    updatedAt: customers.updatedAt,
};

export const customerSchema = z.object({
    fullName: z.string().min(2, 'Nome obrigatório'),
    documentType: z.enum(['CPF', 'CNPJ']).default('CPF'),
    documentNumber: z.string().min(11, 'Documento inválido'),
    phoneNumber: z.string().min(10, 'Telefone inválido'),
    email: z.string().email().optional().or(z.literal('')),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressZipCode: z.string().optional(),
    isBlocked: z.boolean().default(false),
    creditLimit: z.coerce.number().min(0).default(0),
    allowLateRentals: z.boolean().default(false),
    classification: z.enum(['vip', 'new', 'risk', 'inactive']).default('new'),
    source: z.string().optional(),
    notes: z.string().optional(),
});

export async function listCustomers(tenantId: string, filters: { isBlocked?: boolean; search?: string }) {
    let rows;
    try {
        rows = await db
            .select()
            .from(customers)
            .where(eq(customers.tenantId, tenantId))
            .orderBy(customers.fullName);
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[CUSTOMERS] list falling back to safe columns for tenant ${tenantId}. Missing column detected.`);
            rows = await db
                .select(SAFE_CUSTOMER_COLUMNS)
                .from(customers)
                .where(eq(customers.tenantId, tenantId))
                .orderBy(customers.fullName);
        } else {
            throw err;
        }
    }

    let result = (rows as any[]);
    if (filters.isBlocked !== undefined) {
        result = result.filter((c) => c.isBlocked === filters.isBlocked);
    }
    if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(
            (c) =>
                c.fullName.toLowerCase().includes(s) ||
                c.documentNumber.includes(s) ||
                c.phoneNumber.includes(s)
        );
    }
    return result;
}

export async function getCustomer(tenantId: string, id: string) {
    let customer;
    try {
        const [row] = await db.select().from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
        customer = row;
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[CUSTOMERS] get falling back to safe columns for id ${id}.`);
            const [row] = await db
                .select(SAFE_CUSTOMER_COLUMNS)
                .from(customers)
                .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
            customer = row;
        } else {
            throw err;
        }
    }
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    return customer;
}

export async function createCustomer(tenantId: string, data: z.infer<typeof customerSchema>) {
    const safeReturning = {
        id: customers.id,
        fullName: customers.fullName,
        documentNumber: customers.documentNumber,
    };

    try {
        const [customer] = await db.insert(customers).values({
            tenantId,
            ...data,
            email: data.email || null,
            creditLimit: String(data.creditLimit)
        } as any).returning();
        return customer;
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[CUSTOMERS] create fallback for missing columns.`);
            const basicData: any = {
                tenantId,
                fullName: data.fullName,
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                phoneNumber: data.phoneNumber,
                email: data.email || null,
                addressStreet: data.addressStreet,
                addressNumber: data.addressNumber,
                addressCity: data.addressCity,
                addressState: data.addressState,
                isBlocked: data.isBlocked,
                creditLimit: String(data.creditLimit || 0),
            };
            const [customer] = await db.insert(customers).values(basicData).returning(safeReturning);
            return customer;
        }
        throw err;
    }
}

export async function updateCustomer(tenantId: string, id: string, data: Partial<z.infer<typeof customerSchema>>) {
    try {
        const [customer] = await db
            .update(customers)
            .set({
                ...data,
                email: data.email || null,
                creditLimit: data.creditLimit !== undefined ? String(data.creditLimit) : undefined,
                updatedAt: new Date()
            } as any)
            .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
            .returning();
        if (!customer) throw new AppError(404, 'Cliente não encontrado');
        return customer;
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[CUSTOMERS] update fallback for id ${id}`);
            const [customer] = await db
                .update(customers)
                .set({
                    fullName: data.fullName,
                    phoneNumber: data.phoneNumber,
                    email: data.email || null,
                    updatedAt: new Date()
                })
                .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
                .returning({ id: customers.id });
            return customer;
        }
        throw err;
    }
}

export async function deleteCustomer(tenantId: string, id: string) {
    try {
        const [customer] = await db
            .update(customers)
            .set({ updatedAt: new Date(), isBlocked: true })
            .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
            .returning();
        if (!customer) throw new AppError(404, 'Cliente não encontrado');
        return { success: true };
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[CUSTOMERS] delete fallback (hard blocked)`);
            await db
                .update(customers)
                .set({ isBlocked: true })
                .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
            return { success: true };
        }
        throw err;
    }
}

export async function getCustomer360(tenantId: string, id: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new AppError(400, 'ID de cliente inválido');
    }

    let customer;
    try {
        customer = await db.query.customers.findFirst({
            where: and(eq(customers.tenantId, tenantId), eq(customers.id, id)),
            with: {
                rentals: {
                    with: { tool: true, payments: true },
                    orderBy: (rentals, { desc }) => [desc(rentals.startDate)],
                },
                quotes: {
                    with: { items: { with: { tool: true } } },
                    orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
                },
                clientCommunications: {
                    with: { user: { columns: { fullName: true, avatarUrl: true } } },
                    orderBy: (comm, { desc }) => [desc(comm.createdAt)],
                }
            },
        });
    } catch (queryError: any) {
        if (queryError.code === '42703') {
            logger.warn(`[CUSTOMERS] get360 fallback (excluding missing columns)`);
            customer = await db.query.customers.findFirst({
                where: and(eq(customers.tenantId, tenantId), eq(customers.id, id)),
                columns: {
                    classification: false,
                    tags: false,
                    notes: false,
                    deletedAt: false
                },
                with: {
                    rentals: {
                        with: { tool: true, payments: true },
                        orderBy: (rentals, { desc }) => [desc(rentals.startDate)],
                    },
                    quotes: {
                        with: { items: { with: { tool: true } } },
                        orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
                    },
                    clientCommunications: {
                        with: { user: { columns: { fullName: true, avatarUrl: true } } },
                        orderBy: (comm, { desc }) => [desc(comm.createdAt)],
                    }
                }
            });
        } else {
            throw queryError;
        }
    }

    if (!customer) throw new AppError(404, 'Cliente não encontrado');

    const totalRentals = customer.rentals?.length || 0;
    const activeRentals = customer.rentals?.filter(r => r.status === 'active' || r.status === 'overdue').length || 0;
    const totalSpent = customer.rentals?.reduce((sum, r) => sum + parseFloat(r.totalAmountActual || r.totalAmountExpected || '0'), 0) || 0;
    const hasOverdue = customer.rentals?.some(r => r.status === 'overdue') || false;

    // Sort rentals by date to ensure the first one is the latest
    const sortedRentals = [...(customer.rentals || [])].sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    const daysSinceLastRental = sortedRentals[0]
        ? Math.floor((new Date().getTime() - new Date(sortedRentals[0].startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    let classification: 'vip' | 'new' | 'risk' | 'inactive' = 'new';
    if (hasOverdue || customer.isBlocked) classification = 'risk';
    else if (totalSpent > 5000 || totalRentals > 15) classification = 'vip';
    else if (daysSinceLastRental > 120 && totalRentals > 0) classification = 'inactive';
    else if (totalRentals < 3) classification = 'new';

    return {
        ...customer,
        classification,
        metrics: { totalRentals, activeRentals, totalSpent, hasOverdue }
    };
}
