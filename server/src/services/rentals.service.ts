import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { rentals, tools, customers, payments, tenants, users, toolCategories, expenses, maintenanceLogs, quotes, rentalEvents } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import { getPlanLimits } from '../lib/plan-limits';
import logger from '../utils/logger';

export const createRentalSchema = z.object({
    toolId: z.string().uuid('Ferramenta inválida'),
    customerId: z.string().uuid('Cliente inválido'),
    startDate: z.string(),
    endDateExpected: z.string(),
    dailyRateAgreed: z.coerce.number().min(0),
    rentalType: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
    discountType: z.enum(['fixed', 'percentage']).optional(),
    discountValue: z.coerce.number().min(0).default(0),
    securityDeposit: z.coerce.number().min(0).default(0),
    templateId: z.string().uuid().optional(),
    internalNotes: z.string().optional(),
    customerNotes: z.string().optional(),
    notes: z.string().optional(),
});

export const checkinSchema = z.object({
    endDateActual: z.string(),
    paymentMethod: z.enum(['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer']),
    equipmentCondition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
    usageHours: z.coerce.number().optional(),
    damageNotes: z.string().optional(),
    notes: z.string().optional(),
});

function daysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function generateRentalCode(tenantId: string): Promise<string> {
    const existingRentals = await db.select({ rentalCode: rentals.rentalCode }).from(rentals).where(eq(rentals.tenantId, tenantId));
    const maxNum = existingRentals.reduce((max, r) => {
        const num = parseInt(r.rentalCode.slice(2)) || 0;
        return Math.max(max, num);
    }, 0);
    return 'AL' + String(maxNum + 1).padStart(4, '0');
}

export async function listRentals(tenantId: string, filters: { status?: string; search?: string }) {
    const rows = await db.query.rentals.findMany({
        where: eq(rentals.tenantId, tenantId),
        with: {
            tool: { columns: { id: true, name: true, serialNumber: true } },
            customer: { columns: { id: true, fullName: true, phoneNumber: true } },
        },
        orderBy: [desc(rentals.createdAt)],
    });

    let result = rows;
    if (filters.status) result = result.filter((r) => r.status === filters.status);
    if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(
            (r) =>
                r.rentalCode.toLowerCase().includes(s) ||
                r.tool?.name.toLowerCase().includes(s) ||
                r.customer?.fullName.toLowerCase().includes(s)
        );
    }
    return result;
}

export async function getRental(tenantId: string, id: string) {
    const rental = await db.query.rentals.findFirst({
        where: and(eq(rentals.tenantId, tenantId), eq(rentals.id, id)),
        with: {
            tool: true,
            customer: true,
            payments: true,
        },
    });
    if (!rental) throw new AppError(404, 'Locação não encontrada');
    return rental;
}

export async function createRental(tenantId: string, userId: string, data: z.infer<typeof createRentalSchema>) {
    // Check tool availability
    const [tool] = await db.select().from(tools).where(and(eq(tools.tenantId, tenantId), eq(tools.id, data.toolId)));
    if (!tool) throw new AppError(404, 'Ferramenta não encontrada');
    if (tool.status !== 'available') throw new AppError(409, `Ferramenta não disponível (status: ${tool.status})`);

    // Check customer not blocked
    const [customer] = await db.select().from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.id, data.customerId)));
    if (!customer) throw new AppError(404, 'Cliente não encontrado');
    if (customer.isBlocked) throw new AppError(403, 'Cliente bloqueado por inadimplência');

    const startDate = new Date(data.startDate);
    const endDateExpected = new Date(data.endDateExpected);
    const totalDaysExpected = daysBetween(startDate, endDateExpected);

    // Calculate total amount with discounts
    const baseAmount = data.dailyRateAgreed * totalDaysExpected;
    let totalAmountExpected = baseAmount;

    if (data.discountValue > 0) {
        if (data.discountType === 'percentage') {
            totalAmountExpected = baseAmount * (1 - data.discountValue / 100);
        } else {
            totalAmountExpected = Math.max(0, baseAmount - data.discountValue);
        }
    }

    const rentalCode = await generateRentalCode(tenantId);

    const rental = await db.transaction(async (tx) => {
        const [insertedRental] = await tx.insert(rentals).values({
            tenantId,
            toolId: data.toolId,
            customerId: data.customerId,
            rentalCode,
            startDate,
            endDateExpected,
            dailyRateAgreed: String(data.dailyRateAgreed),
            totalDaysExpected,
            totalAmountExpected: String(totalAmountExpected),
            status: 'active',
            rentalType: data.rentalType,
            discountType: data.discountType || 'percentage',
            discountValue: String(data.discountValue || 0),
            securityDeposit: String(data.securityDeposit || 0),
            templateId: data.templateId || null,
            checkoutBy: userId,
            internalNotes: data.internalNotes,
            customerNotes: data.customerNotes,
            notes: data.notes,
        }).returning();
        // Update tool status to rented
        await tx.update(tools).set({ status: 'rented', updatedAt: new Date() }).where(eq(tools.id, data.toolId));

        // Create initial rental event
        await tx.insert(rentalEvents).values({
            tenantId,
            rentalId: insertedRental.id,
            userId,
            type: 'CHECKOUT',
            description: `Locação ${rentalCode} iniciada. Ferramenta: ${tool.name}.`,
            details: {
                baseAmount,
                discount: data.discountValue,
                totalAmountExpected,
                securityDeposit: data.securityDeposit
            }
        });

        // Create pending payment record (now including deposit if applicable)
        await tx.insert(payments).values({
            tenantId,
            rentalId: insertedRental.id,
            amount: String(totalAmountExpected),
            paymentDate: startDate,
            paymentMethod: 'pix',
            status: 'pending',
            receivedBy: userId,
            notes: `Pagamento de locação ${rentalCode} (Caução: R$ ${data.securityDeposit})`,
        });

        return insertedRental;
    });

    console.log(`[RENTAL CREATE] Transaction successful for Rental ${rental.rentalCode}`);
    return rental;
}

export async function checkinRental(tenantId: string, id: string, userId: string, data: z.infer<typeof checkinSchema>) {
    const rental = await getRental(tenantId, id);
    if (rental.status === 'returned') throw new AppError(409, 'Locação já devolvida');
    if (rental.status === 'cancelled') throw new AppError(409, 'Locação cancelada');

    // Get tenant settings for fine calculation
    const [tenant] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId));
    const settings = (tenant?.settings as any) || {};
    const finePercentage = settings.overdueFinePercentage ?? 10;
    const gracePeriodMinutes = settings.gracePeriodMinutes ?? 60;

    const endDateActual = new Date(data.endDateActual);
    const startDate = new Date(rental.startDate);
    const endDateExpected = new Date(rental.endDateExpected);
    const totalDaysActual = daysBetween(startDate, endDateActual);
    const dailyRate = parseFloat(rental.dailyRateAgreed);

    let overdueFineAmount = 0;

    // Advanced Late Fee Logic with Grace Period
    const diffMs = endDateActual.getTime() - endDateExpected.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes > gracePeriodMinutes) {
        const overdueDays = daysBetween(endDateExpected, endDateActual);
        // Multa fixa + Diárias extras proporcionais
        const fixedFine = (dailyRate * totalDaysActual) * (finePercentage / 100);
        overdueFineAmount = fixedFine;

        logger.info(`🚨 [LATE FEE] Applied for Rental ${rental.rentalCode}. Delay: ${diffMinutes}min. Fine: ${overdueFineAmount}`);
    }

    const totalAmountActual = totalDaysActual * dailyRate + overdueFineAmount;

    const updated = await db.transaction(async (tx) => {
        const [updatedRental] = await tx
            .update(rentals)
            .set({
                status: 'returned',
                endDateActual,
                totalDaysActual,
                totalAmountActual: String(totalAmountActual),
                overdueFineAmount: String(overdueFineAmount),
                equipmentCondition: data.equipmentCondition,
                usageHours: data.usageHours ? String(data.usageHours) : null,
                damageNotes: data.damageNotes,
                checkinBy: userId,
                updatedAt: new Date(),
            })
            .where(and(eq(rentals.tenantId, tenantId), eq(rentals.id, id)))
            .returning();

        // Update or create payment record
        const existingPayment = await tx.query.payments.findFirst({
            where: and(eq(payments.rentalId, id), eq(payments.status, 'pending'))
        });

        if (existingPayment) {
            await tx.update(payments).set({
                amount: String(totalAmountActual),
                paymentDate: new Date(),
                paymentMethod: data.paymentMethod,
                status: 'completed',
                receivedBy: userId,
                notes: `Pagamento concluído na devolução. Multa: ${overdueFineAmount}`,
            }).where(eq(payments.id, existingPayment.id));
        } else {
            await tx.insert(payments).values({
                tenantId,
                rentalId: id,
                amount: String(totalAmountActual),
                paymentDate: new Date(),
                paymentMethod: data.paymentMethod,
                status: 'completed',
                receivedBy: userId,
                notes: `Pagamento automático na devolução. Multa: ${overdueFineAmount}`,
            });
        }

        // Update tool back to available and update usage hours
        await tx.update(tools).set({
            status: 'available',
            currentUsageHours: data.usageHours ? sql`${tools.currentUsageHours} + ${String(data.usageHours)}` : tools.currentUsageHours,
            updatedAt: new Date()
        }).where(eq(tools.id, rental.toolId));

        // Create check-in event
        await tx.insert(rentalEvents).values({
            tenantId,
            rentalId: id,
            userId,
            type: 'CHECKIN',
            description: `Devolução de locação ${rental.rentalCode} processada.`,
            details: {
                endDateActual,
                totalDaysActual,
                totalAmountActual,
                overdueFineAmount
            }
        });

        return updatedRental;
    });

    return updated;
}

export async function cancelRental(tenantId: string, id: string) {
    const rental = await getRental(tenantId, id);
    if (rental.status !== 'active' && rental.status !== 'overdue') {
        throw new AppError(400, `Não é possível cancelar uma locação com status: ${rental.status}`);
    }

    const updated = await db.transaction(async (tx) => {
        const [updatedRental] = await tx
            .update(rentals)
            .set({
                status: 'cancelled',
                updatedAt: new Date(),
            })
            .where(and(eq(rentals.tenantId, tenantId), eq(rentals.id, id)))
            .returning();

        // Update tool back to available
        await tx.update(tools).set({ status: 'available', updatedAt: new Date() }).where(eq(tools.id, rental.toolId));

        // Mark pending payments as failed
        await tx.update(payments).set({
            status: 'failed',
            notes: 'Pagamento cancelado devido ao cancelamento da locação'
        }).where(and(eq(payments.rentalId, id), eq(payments.status, 'pending')));

        return updatedRental;
    });

    return updated;
}

export async function getDashboardStats(tenantId: string, period?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Period-based start date for dynamic metrics
    let periodStart = startOfMonth;
    if (period === 'today') periodStart = startOfToday;
    else if (period === '7d') periodStart = lastWeek;
    else if (period === '30d') periodStart = thirtyDaysAgo;

    // Get basic counts and lists for calculation
    const [toolRows, rentalRows, paymentRows, maintenanceRows, newCustomers, expensesRows, quoteRows] = await Promise.all([
        db.select().from(tools).where(eq(tools.tenantId, tenantId)),
        db.query.rentals.findMany({
            where: eq(rentals.tenantId, tenantId),
            with: {
                tool: true,
                customer: { columns: { fullName: true } }
            }
        }),
        db.select({ amount: payments.amount, status: payments.status, paymentDate: payments.paymentDate }).from(payments).where(eq(payments.tenantId, tenantId)),
        db.select({ toolId: maintenanceLogs.toolId, cost: maintenanceLogs.cost }).from(maintenanceLogs).where(eq(maintenanceLogs.tenantId, tenantId)),
        db.select({ id: customers.id }).from(customers).where(and(eq(customers.tenantId, tenantId), sql`${customers.createdAt} >= ${lastWeek}`)),
        db.select({ amount: expenses.amount, category: expenses.category, refId: expenses.refId }).from(expenses).where(eq(expenses.tenantId, tenantId)),
        db.select({ totalAmount: quotes.totalAmount, status: quotes.status }).from(quotes).where(eq(quotes.tenantId, tenantId))
    ]);

    const totalTools = toolRows.length;
    const rentedTools = toolRows.filter((t: any) => t.status === 'rented');
    const availableTools = toolRows.filter((t: any) => t.status === 'available');
    const maintenanceTools = toolRows.filter((t: any) => t.status === 'maintenance');

    const occupancyRate = totalTools > 0 ? (rentedTools.length / totalTools) * 100 : 0;

    const activeRentals = rentalRows.filter((r: any) => r.status === 'active');
    const overdueRentals = activeRentals.filter((r: any) => new Date(r.endDateExpected) < now);

    const returnsToday = activeRentals.filter((r: any) => {
        const end = new Date(r.endDateExpected);
        return end >= startOfToday && end <= endOfToday;
    }).length;

    const maintenanceAlertsCount = toolRows.filter((t: any) => {
        const usageExceeded = t.currentUsageHours && t.nextMaintenanceDueHours && parseFloat(t.currentUsageHours) >= parseFloat(t.nextMaintenanceDueHours);
        let daysExceeded = false;
        if (t.maintenanceIntervalDays && t.lastMaintenanceAt) {
            const lastMaint = new Date(t.lastMaintenanceAt);
            const daysSince = daysBetween(lastMaint, now);
            daysExceeded = daysSince >= t.maintenanceIntervalDays;
        }
        return usageExceeded || daysExceeded;
    }).length;

    // Financials
    const completedPayments = paymentRows.filter((p: any) => p.status === 'completed');
    const actualRevenue = completedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);
    const revenueInPeriod = completedPayments
        .filter((p: any) => new Date(p.paymentDate) >= periodStart)
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);

    const totalExpenses = expensesRows.reduce((sum: number, e: any) => sum + parseFloat(e.amount || '0'), 0);
    const netProfit = actualRevenue - totalExpenses;

    // ROI 2.0 Logic - Assets Ranking with TCO (Total Cost of Ownership)
    const toolStatsMap: Record<string, {
        name: string,
        revenue: number,
        maintenance: number,
        acquisition: number,
        depreciation: number,
        purchaseDate: Date | null,
        recommendation: string
    }> = {};

    toolRows.forEach(t => {
        const purchaseDate = t.acquisitionDate ? new Date(t.acquisitionDate) : null;
        const acqCost = parseFloat(t.acquisitionCost || '0');

        // Depreciation Logic: 20% per year (5 years life)
        let depreciation = 0;
        if (purchaseDate && acqCost > 0) {
            const yearsSince = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            depreciation = acqCost * Math.min(1, yearsSince * 0.2);
        }

        toolStatsMap[t.id] = {
            name: t.name,
            revenue: 0,
            maintenance: 0,
            acquisition: acqCost,
            depreciation: depreciation,
            purchaseDate,
            recommendation: 'keep'
        };
    });

    rentalRows.forEach((r: any) => {
        const amount = parseFloat(r.totalAmountActual || r.totalAmountExpected || '0');
        if (toolStatsMap[r.toolId]) toolStatsMap[r.toolId].revenue += amount;
    });

    maintenanceRows.forEach((m: any) => {
        if (toolStatsMap[m.toolId]) toolStatsMap[m.toolId].maintenance += parseFloat(m.cost || '0');
    });

    const toolROI = Object.entries(toolStatsMap).map(([id, stats]) => {
        const netProfit = stats.revenue - stats.maintenance - stats.depreciation;
        const totalInvested = stats.acquisition + stats.maintenance;
        const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

        // Recommendation Logic
        let recommendation = 'keep';
        if (stats.depreciation >= stats.acquisition * 0.8) recommendation = 'sell';
        else if (stats.maintenance >= stats.acquisition * 0.5) recommendation = 'inspect';

        return { id, ...stats, netProfit, roi, recommendation };
    });

    const topToolsByROI = [...toolROI]
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5);

    const zombieEquipment = toolROI
        .filter(t => {
            const daysOwned = t.purchaseDate ? daysBetween(t.purchaseDate, now) : 365;
            const revenueRatio = t.acquisition > 0 ? (t.revenue / t.acquisition) : 0;
            const maintenanceRatio = t.revenue > 0 ? (t.maintenance / t.revenue) : 1;

            // Zombie if: Owned for > 90 days AND (Low revenue recovery OR high maintenance draine)
            return daysOwned > 90 && (revenueRatio < 0.1 || maintenanceRatio > 0.6);
        })
        .map(t => ({
            id: t.id,
            name: t.name,
            roi: t.roi.toFixed(1),
            reason: (t.maintenance / (t.revenue || 1)) > 0.6 ? 'Custo Manutenção' : 'Ociosidade Crítica'
        }));

    // Advanced Analytics: Revenue History (Last 30 Days)
    const revenueHistoryMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        revenueHistoryMap[dateStr] = 0;
    }

    completedPayments.forEach((p: any) => {
        const d = new Date(p.paymentDate);
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (revenueHistoryMap[dateStr] !== undefined) {
            revenueHistoryMap[dateStr] += parseFloat(p.amount || '0');
        }
    });

    const revenueHistory = Object.entries(revenueHistoryMap).map(([date, amount]) => ({
        date,
        amount
    }));

    // Advanced Analytics: Category ROI
    const categoryStatsMap: Record<string, { revenue: number, count: number }> = {};
    rentalRows.forEach((r: any) => {
        const cat = r.tool?.categoryName || 'Geral';
        const amount = parseFloat(r.totalAmountActual || r.totalAmountExpected || '0');
        if (!categoryStatsMap[cat]) categoryStatsMap[cat] = { revenue: 0, count: 0 };
        categoryStatsMap[cat].revenue += amount;
        categoryStatsMap[cat].count += 1;
    });

    const categoryStats = Object.entries(categoryStatsMap).map(([name, stats]) => ({
        name,
        value: stats.revenue,
        count: stats.count
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // Advanced Analytics: Quote Funnel
    const pendingQuotes = quoteRows.filter((q: any) => q.status === 'draft' || q.status === 'sent');
    const pendingQuotesCount = pendingQuotes.length;
    const potentialRevenue = pendingQuotes.reduce((sum: number, q: any) => sum + parseFloat(q.totalAmount || '0'), 0);

    return {
        available: availableTools.length,
        rented: rentedTools.length,
        total: totalTools,
        activeRentals: activeRentals.length,
        overdueRentalsCount: overdueRentals.length,
        actualRevenue: actualRevenue.toFixed(2),
        revenueThisMonth: revenueInPeriod.toFixed(2),
        netProfit: netProfit.toFixed(2),
        topToolsByROI,
        zombieEquipment,
        occupancyRate: occupancyRate.toFixed(1),
        maintenanceAlertsCount,
        returnsToday,
        revenueHistory,
        categoryStats,
        pendingQuotesCount,
        potentialRevenue
    };
}

export const getToolAvailability = async (tenantId: string, toolId: string) => {
    const data = await db.query.rentals.findMany({
        where: (rentals, { and, eq, ne }) => and(
            eq(rentals.tenantId, tenantId),
            eq(rentals.toolId, toolId),
            ne(rentals.status, 'cancelled')
        ),
        columns: {
            id: true,
            startDate: true,
            endDateExpected: true,
            endDateActual: true,
            status: true,
        },
        orderBy: (rentals, { asc }) => [asc(rentals.startDate)]
    });

    return data;
};

export async function getExpiringRentals(tenantId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const data = await db.query.rentals.findMany({
        where: and(
            eq(rentals.tenantId, tenantId),
            eq(rentals.status, 'active'),
            sql`${rentals.endDateExpected} >= ${startOfToday}`,
            sql`${rentals.endDateExpected} <= ${endOfTomorrow}`
        ),
        with: {
            tool: { columns: { name: true } },
            customer: { columns: { fullName: true, phoneNumber: true } },
        },
        orderBy: [desc(rentals.endDateExpected)],
    });

    return data;
}

