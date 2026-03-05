import { db } from '../db';
import { quotes, tools, customers, NewQuote, rentals, quoteItems, NewQuoteItem } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';

export const createQuoteSchema = z.object({
    customerId: z.string().uuid(),
    startDate: z.string().pipe(z.coerce.date()),
    endDateExpected: z.string().pipe(z.coerce.date()),
    items: z.array(z.object({
        toolId: z.string().uuid(),
        quantity: z.number().int().min(1).default(1),
        dailyRate: z.coerce.number().min(0),
    })).min(1),
    validUntil: z.string().pipe(z.coerce.date()).optional(),
    totalDiscount: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    termsAndConditions: z.string().optional(),
});

async function generateQuoteCode(tenantId: string): Promise<string> {
    const existing = await db.select({ code: quotes.quoteCode }).from(quotes).where(eq(quotes.tenantId, tenantId));
    const maxNum = existing.reduce((max, r) => {
        const num = parseInt(r.code.slice(3)) || 0;
        return Math.max(max, num);
    }, 0);
    return 'ORC' + String(maxNum + 1).padStart(4, '0');
}

export const listQuotes = async (tenantId: string) => {
    return await db.query.quotes.findMany({
        where: eq(quotes.tenantId, tenantId),
        with: {
            customer: true,
            items: {
                with: { tool: true }
            }
        },
        orderBy: [desc(quotes.createdAt)],
    });
};

export const createQuote = async (tenantId: string, data: any) => {
    const validated = createQuoteSchema.parse(data);
    const quoteCode = await generateQuoteCode(tenantId);

    // Calculate total amount
    const durationMs = validated.endDateExpected.getTime() - validated.startDate.getTime();
    const days = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

    let totalAmount = 0;
    const itemsWithTotals = validated.items.map(item => {
        const itemTotal = item.dailyRate * days * item.quantity;
        totalAmount += itemTotal;
        return { ...item, totalAmount: itemTotal };
    });

    totalAmount = Math.max(0, totalAmount - (validated.totalDiscount || 0));

    return await db.transaction(async (tx) => {
        const [newQuote] = await tx.insert(quotes).values({
            tenantId,
            customerId: validated.customerId,
            quoteCode,
            startDate: validated.startDate,
            endDateExpected: validated.endDateExpected,
            totalAmount: String(totalAmount),
            totalDiscount: String(validated.totalDiscount || 0),
            validUntil: validated.validUntil,
            notes: validated.notes,
            termsAndConditions: validated.termsAndConditions,
            status: 'draft',
        }).returning();

        for (const item of itemsWithTotals) {
            await tx.insert(quoteItems).values({
                tenantId,
                quoteId: newQuote.id,
                toolId: item.toolId,
                quantity: item.quantity,
                dailyRate: String(item.dailyRate),
                totalAmount: String(item.totalAmount),
            });
        }

        return newQuote;
    });
};

export const updateQuoteStatus = async (tenantId: string, id: string, status: string) => {
    const [updated] = await db.update(quotes)
        .set({ status: status as any, updatedAt: new Date() })
        .where(and(eq(quotes.id, id), eq(quotes.tenantId, tenantId)))
        .returning();

    return updated;
};

export const getQuote = async (tenantId: string, id: string) => {
    return await db.query.quotes.findFirst({
        where: and(eq(quotes.id, id), eq(quotes.tenantId, tenantId)),
        with: {
            customer: true,
            items: {
                with: { tool: true }
            }
        },
    });
};

export const convertToRental = async (tenantId: string, quoteId: string, userId: string) => {
    return await db.transaction(async (tx) => {
        const quote = await tx.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
            with: { items: { with: { tool: true } } }
        });

        if (!quote) throw new AppError(404, 'Orçamento não encontrado');
        if (quote.status !== 'accepted') throw new AppError(400, 'Apenas orçamentos aprovados podem ser convertidos');

        const createdRentals = [];

        for (const item of quote.items) {
            // One rental per item (since schema is tool-based for now)
            // If quantity > 1, we might need to handle serial numbers or multiple tool records
            // For now, we assume 1 tool record = 1 unit
            const [newRental] = await tx.insert(rentals).values({
                tenantId,
                toolId: item.toolId,
                customerId: quote.customerId,
                rentalCode: `AL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                startDate: quote.startDate,
                endDateExpected: quote.endDateExpected,
                dailyRateAgreed: item.dailyRate,
                totalAmountExpected: item.totalAmount,
                totalDaysExpected: Math.max(1, Math.ceil((quote.endDateExpected.getTime() - quote.startDate.getTime()) / (1000 * 60 * 60 * 24))),
                status: 'active',
                checkoutBy: userId,
            }).returning();

            await tx.update(tools)
                .set({ status: 'rented', updatedAt: new Date() })
                .where(eq(tools.id, item.toolId));

            createdRentals.push(newRental);
        }

        await tx.update(quotes)
            .set({ status: 'accepted', updatedAt: new Date() })
            .where(eq(quotes.id, quoteId));

        return createdRentals;
    });
};
