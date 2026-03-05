import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { activityLogs } from '../db/schema';

export async function logActivity(data: {
    tenantId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        await db.insert(activityLogs).values({
            tenantId: data.tenantId,
            userId: data.userId,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            details: data.details || {},
            ipAddress: data.ipAddress,
        });
    } catch (error) {
        console.error('[ActivityLog] Failed to log activity:', error);
    }
}

export async function getLogs(tenantId: string, filters?: { entityId?: string; entityType?: string }) {
    const conditions = [eq(activityLogs.tenantId, tenantId)];

    if (filters?.entityId) {
        conditions.push(eq(activityLogs.entityId, filters.entityId));
    }
    if (filters?.entityType) {
        conditions.push(eq(activityLogs.entityType, filters.entityType));
    }

    return await db.query.activityLogs.findMany({
        where: and(...conditions),
        orderBy: [desc(activityLogs.createdAt)],
        limit: 50,
        with: {
            user: {
                columns: {
                    fullName: true,
                    email: true,
                }
            }
        }
    });
}
