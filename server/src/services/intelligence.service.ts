import { db } from '../db';
import { tools, rentals, maintenanceLogs, toolCategories, payments, expenses, customers } from '../db/schema';
import { eq, and, sql, sum, gte, lte, isNull } from 'drizzle-orm';

export interface RoiInsight {
    toolId: string;
    toolName: string;
    categoryName: string;
    revenue: number;
    maintenanceCost: number;
    acquisitionCost: number;
    roi: number; // Overall ROI
    roiPercent: number;
    paybackProgress: number; // % of cost recovered
    utilizationRate: number; // % of days rented since acquisition
    daysOwned: number;
    daysRented: number;
    lastRentalDate: Date | null;
    status: string;
    suggestion: {
        type: 'increase' | 'decrease' | 'maintain' | 'replace' | 'alert';
        text: string;
        action: string;
    };
    healthScore: number;
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export function calculateAssetHealth(tool: any): { score: number, status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' } {
    let score = 100;
    const now = new Date();
    const acqCost = parseFloat(tool.acquisitionCost || '0');
    const maintenanceCost = (tool.maintenanceLogs || []).reduce((acc: number, m: any) => acc + parseFloat(m.cost || '0'), 0);
    const revenue = (tool.rentals || []).reduce((acc: number, r: any) => acc + parseFloat(r.totalAmountActual || '0'), 0);

    // 1. Maintenance Draine: If maintenance > 40% of revenue, drop score
    if (revenue > 0) {
        const maintRatio = maintenanceCost / revenue;
        if (maintRatio > 0.4) score -= 20;
        if (maintRatio > 0.7) score -= 20;
    }

    // 2. Usage/Age: If tool is old and hasn't paid itself back
    const start = tool.acquisitionDate ? new Date(tool.acquisitionDate) : tool.createdAt;
    const daysOwned = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysOwned > 365 && revenue < acqCost) {
        score -= 10;
    }

    // 3. Maintenance Recency & Predictive Alert
    const usageHours = parseFloat(tool.currentUsageHours || '0');
    const nextMaint = parseFloat(tool.nextMaintenanceDueHours || '0');

    if (nextMaint > 0) {
        const usagePercent = (usageHours / nextMaint) * 100;
        if (usagePercent >= 100) score -= 40; // Overdue
        else if (usagePercent >= 90) score -= 25; // Critical (Alert!)
        else if (usagePercent >= 80) score -= 10; // Warning
    }

    // 4. Critical Status
    if (tool.status === 'lost' || tool.status === 'unavailable') score = 0;
    if (tool.status === 'maintenance') score = Math.min(score, 40);

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'excellent';
    if (score < 40) status = 'critical';
    else if (score < 60) status = 'poor';
    else if (score < 80) status = 'fair';
    else if (score < 90) status = 'good';

    return { score: Math.max(0, score), status };
}

export async function getRoiInsights(tenantId: string): Promise<RoiInsight[]> {
    // Perform complex aggregation in a single query for maximum performance
    const toolStats = await db.select({
        id: tools.id,
        name: tools.name,
        status: tools.status,
        acquisitionCost: tools.acquisitionCost,
        acquisitionDate: tools.acquisitionDate,
        createdAt: tools.createdAt,
        currentUsageHours: tools.currentUsageHours,
        nextMaintenanceDueHours: tools.nextMaintenanceDueHours,
        categoryName: toolCategories.name,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${rentals.deletedAt} IS NULL THEN CAST(COALESCE(${rentals.totalAmountActual}, '0') AS NUMERIC) END), '0')`,
        maintenanceCost: sql<string>`COALESCE(SUM(CAST(COALESCE(${maintenanceLogs.cost}, '0') AS NUMERIC)), '0')`,
        daysRented: sql<number>`CAST(COALESCE(SUM(${rentals.totalDaysActual}), 0) AS INTEGER)`,
        lastRentalDate: sql<string>`MAX(${rentals.startDate})`
    })
        .from(tools)
        .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
        .leftJoin(rentals, eq(tools.id, rentals.toolId))
        .leftJoin(maintenanceLogs, eq(tools.id, maintenanceLogs.toolId))
        .where(and(eq(tools.tenantId, tenantId), isNull(tools.deletedAt)))
        .groupBy(tools.id, toolCategories.name);

    const now = new Date();

    const insights: RoiInsight[] = toolStats.map((stat) => {
        const acquisitionCost = parseFloat(stat.acquisitionCost || '0');
        const revenue = parseFloat(stat.revenue || '0');
        const maintenanceCost = parseFloat(stat.maintenanceCost || '0');
        const totalCost = acquisitionCost + maintenanceCost;

        const start = stat.acquisitionDate ? new Date(stat.acquisitionDate) : stat.createdAt;
        const daysOwned = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const utilizationRate = Math.min(100, ((stat.daysRented || 0) / daysOwned) * 100);

        const netProfit = revenue - totalCost;
        const roi = totalCost > 0 ? (netProfit / totalCost) : 0;
        const paybackProgress = totalCost > 0 ? Math.min(100, (revenue / totalCost) * 100) : (revenue > 0 ? 100 : 0);

        const lastRentalDate = stat.lastRentalDate ? new Date(stat.lastRentalDate) : null;
        const daysSinceLastRental = lastRentalDate
            ? Math.floor((now.getTime() - lastRentalDate.getTime()) / (1000 * 60 * 60 * 24))
            : daysOwned;

        // Health Score (local calc for now)
        const health = calculateAssetHealth({
            ...stat,
            maintenanceLogs: [{ cost: stat.maintenanceCost }], // Mock for health logic
            rentals: [{ totalAmountActual: stat.revenue }] // Mock for health logic
        });

        // Dynamic Suggestion Logic
        let suggestion: RoiInsight['suggestion'] = {
            type: 'maintain',
            text: 'Desempenho Estável',
            action: 'Manter estratégia atual.'
        };

        if (maintenanceCost > (revenue * 0.5) && daysOwned > 90) {
            suggestion = { type: 'replace', text: 'Dreno de Caixa (Manutenção > 50%)', action: 'Ativo ineficiente. Avaliar venda.' };
        } else if (utilizationRate > 75 && paybackProgress > 80) {
            suggestion = { type: 'increase', text: 'Alta Demanda', action: 'Aumentar diária ou adquirir nova unidade.' };
        } else if (daysSinceLastRental > 45 && utilizationRate < 15 && daysOwned > 60) {
            suggestion = { type: 'decrease', text: 'Equipamento Zumbi', action: 'Sem locações recentes. Aplicar promoção.' };
        }

        return {
            toolId: stat.id,
            toolName: stat.name,
            categoryName: stat.categoryName || 'Geral',
            revenue,
            maintenanceCost,
            acquisitionCost,
            roi,
            roiPercent: roi * 100,
            paybackProgress,
            utilizationRate,
            daysOwned,
            daysRented: stat.daysRented || 0,
            lastRentalDate,
            status: stat.status,
            suggestion,
            healthScore: health.score,
            healthStatus: health.status,
        };
    });

    return insights.sort((a, b) => b.roi - a.roi);
}

export interface CashFlowInsight {
    currentBalance: number;
    revenue30d: number;
    expenses30d: number;
    netProfit30d: number;
    forecasting: {
        expectedNext30d: number;
        projectionStatus: 'growth' | 'stable' | 'decline';
        confidence: number;
    };
    breakEvenDays: number; // Days to cover this month's expenses
    healthScore: number; // 0-100 score
}

export async function getCashFlowIntelligence(tenantId: string): Promise<CashFlowInsight> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch aggregated financial data in parallel
    const [stats, activeRentals] = await Promise.all([
        db.select({
            revenue30d: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'completed' AND ${payments.paymentDate} >= ${thirtyDaysAgo} THEN CAST(${payments.amount} AS NUMERIC) END), '0')`,
            expenses30d: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.createdAt} >= ${thirtyDaysAgo} THEN CAST(${expenses.amount} AS NUMERIC) END), '0')`
        })
            .from(sql`(SELECT 1) as dummy`) // Dummy join to allow multiple selects from different tables if needed, but here we just use subqueries or separate calls.
            // Actually, separate calls are cleaner for different tables in Drizzle if not related.
            .then(async () => {
                const [rev] = await db.select({ val: sql<string>`SUM(CAST(${payments.amount} AS NUMERIC))` }).from(payments).where(and(eq(payments.tenantId, tenantId), eq(payments.status, 'completed'), gte(payments.paymentDate, thirtyDaysAgo)));
                const [exp] = await db.select({ val: sql<string>`SUM(CAST(${expenses.amount} AS NUMERIC))` }).from(expenses).where(and(eq(expenses.tenantId, tenantId), gte(expenses.createdAt, thirtyDaysAgo)));
                return { revenue30d: rev?.val || '0', expenses30d: exp?.val || '0' };
            }),
        db.select({ totalAmountExpected: rentals.totalAmountExpected })
            .from(rentals)
            .where(and(eq(rentals.tenantId, tenantId), eq(rentals.status, 'active'), isNull(rentals.deletedAt)))
    ]);

    const revenue30d = parseFloat(stats.revenue30d);
    const expenses30d = parseFloat(stats.expenses30d);
    const netProfit30d = revenue30d - expenses30d;

    // Forecasting: Sum of expected revenue from active rentals
    const expectedNext30d = activeRentals.reduce((acc, r) => acc + parseFloat(r.totalAmountExpected || '0'), 0);

    // Simple projection status
    const projectionStatus = expectedNext30d > revenue30d ? 'growth' : (expectedNext30d < revenue30d * 0.7 ? 'decline' : 'stable');

    // Break-even logic
    const avgDailyRev = revenue30d / 30;
    const breakEvenDays = avgDailyRev > 0 ? Math.ceil(expenses30d / avgDailyRev) : 999;

    let healthScore = 50;
    if (netProfit30d > 0) healthScore += 20;
    if (projectionStatus === 'growth') healthScore += 20;
    if (breakEvenDays < 15) healthScore += 10;
    if (netProfit30d < 0) healthScore -= 30;

    return {
        currentBalance: netProfit30d,
        revenue30d,
        expenses30d,
        netProfit30d,
        forecasting: {
            expectedNext30d,
            projectionStatus,
            confidence: 90
        },
        breakEvenDays: Math.min(31, breakEvenDays),
        healthScore: Math.max(0, Math.min(100, healthScore))
    };
}

export async function getNewCustomersReport(tenantId: string, startDate: Date, endDate: Date) {
    const data = await db.query.customers.findMany({
        where: and(
            eq(customers.tenantId, tenantId),
            isNull(customers.deletedAt),
            gte(customers.createdAt, startDate),
            lte(customers.createdAt, endDate)
        )
    });
    return data;
}

export async function getOperationalSummary(tenantId: string, startDate: Date, endDate: Date) {
    const rentalsCreated = await db.select({ count: sql`count(*)` })
        .from(rentals)
        .where(and(
            eq(rentals.tenantId, tenantId),
            isNull(rentals.deletedAt),
            gte(rentals.createdAt, startDate),
            lte(rentals.createdAt, endDate)
        ));

    const rentalsReturned = await db.select({ count: sql`count(*)` })
        .from(rentals)
        .where(and(
            eq(rentals.tenantId, tenantId),
            isNull(rentals.deletedAt),
            eq(rentals.status, 'returned'),
            gte(rentals.updatedAt, startDate),
            lte(rentals.updatedAt, endDate)
        ));

    return {
        rentalsCreated: Number((rentalsCreated[0] as any).count),
        rentalsReturned: Number((rentalsReturned[0] as any).count)
    };
}
