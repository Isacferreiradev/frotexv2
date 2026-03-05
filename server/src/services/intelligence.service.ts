import { db } from '../db';
import { tools, rentals, maintenanceLogs, toolCategories, payments, expenses } from '../db/schema';
import { eq, and, sql, sum, gte, lte } from 'drizzle-orm';

export interface RoiInsight {
    toolId: string;
    toolName: string;
    categoryName: string;
    revenue: number;
    maintenanceCost: number;
    acquisitionCost: number;
    roi: number; // Overall ROI
    roiPercent: number;
    utilizationRate: number; // % of days rented since acquisition
    daysOwned: number;
    daysRented: number;
    status: string;
    suggestion: {
        type: 'increase' | 'decrease' | 'maintain' | 'replace' | 'alert';
        text: string;
        action: string;
    };
}

export async function getRoiInsights(tenantId: string): Promise<RoiInsight[]> {
    // 1. Fetch all tools for the tenant
    const allTools = await db.query.tools.findMany({
        where: eq(tools.tenantId, tenantId),
        with: {
            category: true,
            maintenanceLogs: true,
            rentals: true,
        }
    });

    const insights: RoiInsight[] = allTools.map((tool) => {
        const acquisitionCost = parseFloat(tool.acquisitionCost || '0');

        // Sum revenue from actual rentals
        const revenue = tool.rentals.reduce((acc, r) => {
            return acc + parseFloat(r.totalAmountActual || '0');
        }, 0);

        // Sum maintenance costs
        const maintenanceCost = tool.maintenanceLogs.reduce((acc, m) => {
            return acc + parseFloat(m.cost || '0');
        }, 0);

        // Calculate days owned
        const start = tool.acquisitionDate ? new Date(tool.acquisitionDate) : tool.createdAt;
        const now = new Date();
        const daysOwned = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Calculate days rented (sum of totalDaysActual)
        const daysRented = tool.rentals.reduce((acc, r) => {
            return acc + (r.totalDaysActual || 0);
        }, 0);

        const utilizationRate = Math.min(100, (daysRented / daysOwned) * 100);
        const totalCost = acquisitionCost + maintenanceCost;
        const roi = totalCost > 0 ? (revenue / totalCost) : 0;
        const roiPercent = roi * 100;

        // Dynamic Suggestion Logic
        let suggestion: RoiInsight['suggestion'] = {
            type: 'maintain',
            text: 'Desempenho Estável',
            action: 'Manter estratégia atual.'
        };

        if (maintenanceCost > (revenue * 0.4) && daysOwned > 90) {
            suggestion = {
                type: 'replace',
                text: 'Custo de Manutenção Crítico',
                action: 'Avaliar descarte ou substituição do ativo.'
            };
        } else if (utilizationRate > 80 && roi > 1.5) {
            suggestion = {
                type: 'increase',
                text: 'Alta Demanda e ROI',
                action: 'Aumentar diária em 10% a 15%.'
            };
        } else if (utilizationRate < 20 && daysOwned > 60) {
            suggestion = {
                type: 'decrease',
                text: 'Equipamento Zumbi (Ocioso)',
                action: 'Aplicar promoção ou revisar visibilidade.'
            };
        } else if (roi < 0.2 && daysOwned > 180) {
            suggestion = {
                type: 'alert',
                text: 'Retorno sobre Investimento Baixo',
                action: 'Rever precificação ou custo de aquisição.'
            };
        }

        return {
            toolId: tool.id,
            toolName: tool.name,
            categoryName: tool.category?.name || 'Geral',
            revenue,
            maintenanceCost,
            acquisitionCost,
            roi,
            roiPercent,
            utilizationRate,
            daysOwned,
            daysRented,
            status: tool.status,
            suggestion
        };
    });

    // Sort by ROI descending
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

    // Fetch financial data
    const [paymentRows, expenseRows, activeRentals] = await Promise.all([
        db.select().from(payments).where(and(eq(payments.tenantId, tenantId), gte(payments.paymentDate, thirtyDaysAgo))),
        db.select().from(expenses).where(and(eq(expenses.tenantId, tenantId), gte(expenses.createdAt, thirtyDaysAgo))),
        db.select({ totalAmountExpected: rentals.totalAmountExpected, endDateExpected: rentals.endDateExpected })
            .from(rentals)
            .where(and(eq(rentals.tenantId, tenantId), eq(rentals.status, 'active')))
    ]);

    const revenue30d = paymentRows.filter(p => p.status === 'completed').reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);
    const expenses30d = expenseRows.reduce((acc, e) => acc + parseFloat(e.amount || '0'), 0);
    const netProfit30d = revenue30d - expenses30d;

    // Forecasting: Sum of expected revenue from active rentals in the next 30 days
    const expectedNext30d = activeRentals.reduce((acc, r) => acc + parseFloat(r.totalAmountExpected || '0'), 0);

    // Simple projection status
    const projectionStatus = expectedNext30d > revenue30d ? 'growth' : (expectedNext30d < revenue30d * 0.7 ? 'decline' : 'stable');

    // Break-even logic for current month
    const avgDailyRev = revenue30d / 30;
    const breakEvenDays = avgDailyRev > 0 ? Math.ceil(expenses30d / avgDailyRev) : 999;

    // Business Health Score (0-100)
    // Factors: Profitability, Forecasting, Break-even
    let healthScore = 50;
    if (netProfit30d > 0) healthScore += 20;
    if (projectionStatus === 'growth') healthScore += 15;
    if (breakEvenDays < 15) healthScore += 15;
    if (netProfit30d < 0) healthScore -= 30;

    return {
        currentBalance: revenue30d - expenses30d, // Simplified
        revenue30d,
        expenses30d,
        netProfit30d,
        forecasting: {
            expectedNext30d,
            projectionStatus,
            confidence: 85 // High level of confidence based on active contracts
        },
        breakEvenDays: Math.min(31, breakEvenDays),
        healthScore: Math.max(0, Math.min(100, healthScore))
    };
}
