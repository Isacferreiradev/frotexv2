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

    // 3. Maintenance Recency: If maintenance was very recent (good) or overdue
    const usageExceeded = tool.currentUsageHours && tool.nextMaintenanceDueHours && parseFloat(tool.currentUsageHours) >= parseFloat(tool.nextMaintenanceDueHours);
    if (usageExceeded) score -= 30;

    // 4. Critical Status
    if (tool.status === 'lost' || tool.status === 'unavailable') score = 0;
    if (tool.status === 'maintenance') score = Math.min(score, 40);

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'excellent';
    if (score < 20) status = 'critical';
    else if (score < 40) status = 'critical'; // Adjusted status names
    else if (score < 60) status = 'poor';
    else if (score < 80) status = 'fair';
    else if (score < 90) status = 'good';

    return { score: Math.max(0, score), status };
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

        // Find last rental date
        const lastRentalDate = tool.rentals.length > 0
            ? new Date(Math.max(...tool.rentals.map(r => new Date(r.startDate).getTime())))
            : null;

        const utilizationRate = Math.min(100, (daysRented / daysOwned) * 100);
        const totalCost = acquisitionCost + maintenanceCost;

        // Standard ROI: (Net Profit / Cost) * 100
        const netProfit = revenue - totalCost;
        const roi = totalCost > 0 ? (netProfit / totalCost) : 0;
        const roiPercent = roi * 100;

        // Payback Progress: (Revenue / Total Cost) * 100
        const paybackProgress = totalCost > 0 ? Math.min(100, (revenue / totalCost) * 100) : (revenue > 0 ? 100 : 0);

        // Dynamic Suggestion Logic
        let suggestion: RoiInsight['suggestion'] = {
            type: 'maintain',
            text: 'Desempenho Estável',
            action: 'Manter estratégia atual.'
        };

        // Recency check for Zombie detection
        const daysSinceLastRental = lastRentalDate
            ? Math.floor((now.getTime() - lastRentalDate.getTime()) / (1000 * 60 * 60 * 24))
            : daysOwned;

        if (maintenanceCost > (revenue * 0.5) && daysOwned > 90) {
            suggestion = {
                type: 'replace',
                text: 'Dreno de Caixa (Manutenção > 50%)',
                action: 'Este ativo custa mais mantê-lo do que gera. Avaliar venda.'
            };
        } else if (utilizationRate > 75 && paybackProgress > 80) {
            suggestion = {
                type: 'increase',
                text: 'Alta Demanda e Rentabilidade',
                action: 'Aumentar diária em 15% ou adquirir nova unidade.'
            };
        } else if (daysSinceLastRental > 45 && utilizationRate < 15 && daysOwned > 60) {
            suggestion = {
                type: 'decrease',
                text: 'Equipamento Zumbi (Inativo)',
                action: 'Sem locações há 45+ dias. Aplicar promoção agressiva.'
            };
        } else if (paybackProgress < 20 && daysOwned > 180) {
            suggestion = {
                type: 'alert',
                text: 'Payback Excessivamente Lento',
                action: 'Rever precificação ou considerar quebra de estoque.'
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
            paybackProgress,
            utilizationRate,
            daysOwned,
            daysRented,
            lastRentalDate,
            status: tool.status,
            suggestion,
            healthScore: calculateAssetHealth(tool).score,
            healthStatus: calculateAssetHealth(tool).status,
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
