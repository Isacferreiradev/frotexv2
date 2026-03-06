import { and, eq, lt, gte, sql, isNull } from 'drizzle-orm';
import { db } from '../db';
import { rentals, tools, quotes, dismissedAlerts } from '../db/schema';

export interface Alert {
    id: string;
    type: 'overdue_rental' | 'expiring_quote' | 'maintenance_due' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    link: string;
    createdAt: Date;
}

export async function getActiveAlerts(tenantId: string): Promise<Alert[]> {
    const now = new Date();
    const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

    const dismissed = await db.select({ alertId: dismissedAlerts.alertId })
        .from(dismissedAlerts)
        .where(eq(dismissedAlerts.tenantId, tenantId));
    const dismissedIds = new Set(dismissed.map(d => d.alertId));

    const alerts: Alert[] = [];

    // 1. Overdue Rentals
    const overdueRentals = await db.query.rentals.findMany({
        where: and(
            eq(rentals.tenantId, tenantId),
            eq(rentals.status, 'active'),
            lt(rentals.endDateExpected, now)
        ),
        with: {
            tool: { columns: { name: true } },
            customer: { columns: { fullName: true } }
        }
    });

    overdueRentals.forEach(r => {
        alerts.push({
            id: `rental-${r.id}`,
            type: 'overdue_rental',
            severity: 'critical',
            title: 'Locação Atrasada',
            description: `${r.tool?.name} - Cliente: ${r.customer?.fullName}`,
            link: `/locacoes?id=${r.id}`,
            createdAt: r.endDateExpected!
        });
    });

    // 2. Expiring Quotes
    const expiringQuotes = await db.query.quotes.findMany({
        where: and(
            eq(quotes.tenantId, tenantId),
            eq(quotes.status, 'sent'),
            lt(quotes.validUntil, soon)
        ),
        with: {
            customer: { columns: { fullName: true } }
        }
    });

    expiringQuotes.forEach(q => {
        alerts.push({
            id: `quote-${q.id}`,
            type: 'expiring_quote',
            severity: 'medium',
            title: 'Orçamento Expirando',
            description: `Cliente: ${q.customer?.fullName} - R$ ${q.totalAmount}`,
            link: `/orcamentos`,
            createdAt: q.validUntil!
        });
    });

    // 3. Maintenance Due
    const maintenanceDue = await db.query.tools.findMany({
        where: and(
            eq(tools.tenantId, tenantId),
            isNull(tools.deletedAt),
            sql`${tools.currentUsageHours} >= ${tools.nextMaintenanceDueHours}`
        )
    });

    maintenanceDue.forEach(t => {
        alerts.push({
            id: `maint-${t.id}`,
            type: 'maintenance_due',
            severity: 'high',
            title: 'Manutenção Pendente',
            description: `${t.name} atingiu o limite de horas de uso.`,
            link: `/manutencao`,
            createdAt: new Date()
        });
    });

    return alerts
        .filter(a => !dismissedIds.has(a.id))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function dismissAlerts(tenantId: string, alertIds: string[]) {
    const values = alertIds.map(alertId => ({
        tenantId,
        alertId,
    }));
    await db.insert(dismissedAlerts).values(values).onConflictDoNothing();
}
