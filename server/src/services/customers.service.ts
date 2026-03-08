import { eq, and, isNull, or, ilike, SQL, desc } from 'drizzle-orm';
import { db } from '../db';
import { customers } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { z } from 'zod';

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
    tags: z.array(z.string()).optional().default([]),
    notes: z.string().optional(),
});

export async function listCustomers(tenantId: string, filters: { isBlocked?: boolean; search?: string }) {
    let rows;
    try {
        const query = db
            .select() // Using select() will try all columns.
            .from(customers)
            .where(eq(customers.tenantId, tenantId))
            .orderBy(customers.fullName);

        rows = await query;
    } catch (err: any) {
        // Fallback for production if new columns (tags, classification, deletedAt) are missing
        if (err.code === '42703') {
            console.warn(`[CUSTOMERS] list falling back to safe columns for tenant ${tenantId}. Missing column detected.`);
            rows = await db.query.customers.findMany({
                where: eq(customers.tenantId, tenantId),
                // findMany with specific columns/relations might be safer or Drizzle-safe
                orderBy: [customers.fullName]
            });
        } else {
            throw err;
        }
    }

    let result = rows;
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
        [customer] = await db
            .select()
            .from(customers)
            .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
            .limit(1);
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[CUSTOMERS] get fallback for ${id}. Missing column detected.`);
            customer = await db.query.customers.findFirst({
                where: and(eq(customers.tenantId, tenantId), eq(customers.id, id))
            });
        } else {
            throw err;
        }
    }
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    return customer;
}

export async function createCustomer(tenantId: string, data: z.infer<typeof customerSchema>) {
    try {
        const [customer] = await db.insert(customers).values({
            tenantId,
            ...data,
            email: data.email || null,
            tags: data.tags || [],
            creditLimit: String(data.creditLimit)
        }).returning();
        return customer;
    } catch (err: any) {
        if (err.code === '42703') {
            logger.error(`[CUSTOMERS] create failed due to missing columns. Data: ${JSON.stringify(data)}`);
            // Try emergency insert without the likely culprits (tags, classification, notes)
            const backupData: any = {
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
            };
            try {
                const [customer] = await db.insert(customers).values(backupData).returning();
                return customer;
            } catch (innerErr) {
                throw new AppError(500, `Erro crítico ao criar cliente: Campo obrigatório faltando no banco. Por favor, execute as migrações no Railway.`);
            }
        }
        throw err;
    }
}

export async function updateCustomer(tenantId: string, id: string, data: Partial<z.infer<typeof customerSchema>>) {
    const [customer] = await db
        .update(customers)
        .set({
            ...data,
            email: data.email || null,
            creditLimit: data.creditLimit !== undefined ? String(data.creditLimit) : undefined,
            updatedAt: new Date()
        })
        .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
        .returning();
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    return customer;
}

export async function deleteCustomer(tenantId: string, id: string) {
    const [customer] = await db
        .update(customers)
        .set({ updatedAt: new Date(), isBlocked: true })
        .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
        .returning();
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    return { success: true };
}

export async function getCustomer360(tenantId: string, id: string) {
    console.log(`[SERVICE] getCustomer360 - params:`, { tenantId, id });

    // Validate UUID format to avoid Drizzle/PG potential errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        console.warn(`[SERVICE] getCustomer360 - Invalid UUID format: ${id}`);
        throw new AppError(400, 'ID de cliente inválido');
    }

    let customer;
    try {
        customer = await db.query.customers.findFirst({
            where: and(eq(customers.tenantId, tenantId), eq(customers.id, id)),
            with: {
                rentals: {
                    with: {
                        tool: true,
                        payments: true,
                    },
                    orderBy: (rentals, { desc }) => [desc(rentals.createdAt)],
                },
                quotes: {
                    with: {
                        items: {
                            with: {
                                tool: true
                            }
                        },
                    },
                    orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
                },
                clientCommunications: {
                    with: {
                        user: {
                            columns: {
                                fullName: true,
                                avatarUrl: true
                            }
                        }
                    },
                    orderBy: (comm, { desc }) => [desc(comm.createdAt)],
                }
            },
        });
    } catch (queryError: any) {
        console.error(`[SERVICE] getCustomer360 - Query failed for tenant ${tenantId} and id ${id}:`, queryError);
        // If it's a "missing column" error, provide a more helpful message
        if (queryError.code === '42703') {
            throw new AppError(500, `Erro de consistência de dados (coluna faltando). Por favor, execute as migrações mais recentes.`);
        }
        throw queryError;
    }

    if (!customer) {
        console.warn(`[SERVICE] getCustomer360 - Customer not found for tenant ${tenantId} and id ${id}`);
        throw new AppError(404, 'Cliente não encontrado');
    }

    // Calculate aggregated metrics
    const totalRentals = customer.rentals.length;
    const activeRentals = customer.rentals.filter(r => r.status === 'active' || r.status === 'overdue').length;
    const totalSpent = customer.rentals.reduce((sum, r) => sum + parseFloat(r.totalAmountActual || r.totalAmountExpected || '0'), 0);

    // Inadimplência logic
    const hasOverdue = customer.rentals.some(r => r.status === 'overdue');

    // Automatic Classification Logic
    const daysSinceLastRental = customer.rentals[0]
        ? Math.floor((new Date().getTime() - new Date(customer.rentals[0].startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    let classification: 'vip' | 'new' | 'risk' | 'inactive' = 'new';

    if (hasOverdue || customer.isBlocked) {
        classification = 'risk';
    } else if (totalSpent > 5000 || totalRentals > 15) {
        classification = 'vip';
    } else if (daysSinceLastRental > 120 && totalRentals > 0) {
        classification = 'inactive';
    } else if (totalRentals < 3) {
        classification = 'new';
    }

    return {
        ...customer,
        classification, // Return calculated classification
        metrics: {
            totalRentals,
            activeRentals,
            totalSpent,
            hasOverdue,
        }
    };
}
