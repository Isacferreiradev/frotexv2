import { eq, and, or, ilike, SQL, desc, isNull } from 'drizzle-orm';
import { db } from '../db';
import { customers } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
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
    notes: z.string().optional(),
});

export async function listCustomers(tenantId: string, filters: { isBlocked?: boolean; search?: string }) {
    const rows = await db
        .select()
        .from(customers)
        .where(and(eq(customers.tenantId, tenantId), isNull(customers.deletedAt)))
        .orderBy(customers.fullName);

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
    const [customer] = await db.select().from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.id, id), isNull(customers.deletedAt)));
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    return customer;
}

export async function createCustomer(tenantId: string, data: z.infer<typeof customerSchema>) {
    const [customer] = await db.insert(customers).values({
        tenantId,
        ...data,
        email: data.email || null,
        creditLimit: String(data.creditLimit)
    }).returning();
    return customer;
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
        .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id), isNull(customers.deletedAt)))
        .returning();
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    return customer;
}

export async function deleteCustomer(tenantId: string, id: string) {
    const [customer] = await db
        .update(customers)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id), isNull(customers.deletedAt)))
        .returning();
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    return { success: true };
}

export async function getCustomer360(tenantId: string, id: string) {
    const customer = await db.query.customers.findFirst({
        where: and(eq(customers.tenantId, tenantId), eq(customers.id, id), isNull(customers.deletedAt)),
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

    if (!customer) throw new AppError(404, 'Cliente não encontrado');

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
