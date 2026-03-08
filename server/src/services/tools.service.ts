import { eq, and, ilike, or, SQL, desc, isNull, inArray } from 'drizzle-orm';
import { db } from '../db';
import { tools, toolCategories, rentals, customers } from '../db/schema';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';

import { getPlanLimits } from '../lib/plan-limits';
import { tenants } from '../db/schema';
import { sql } from 'drizzle-orm';

export const toolSchema = z.object({
    categoryId: z.string().uuid('Categoria inválida'),
    subcategoryId: z.string().uuid().optional().nullable(),
    name: z.string().min(2, 'Nome obrigatório'),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    assetTag: z.string().optional(),
    dailyRate: z.coerce.number().min(0).default(0),
    minRentalValue: z.coerce.number().min(0).default(0),
    cleaningFee: z.coerce.number().min(0).default(0),
    status: z.enum(['available', 'rented', 'maintenance', 'unavailable', 'lost', 'sold']).default('available'),
    nextMaintenanceDueHours: z.coerce.number().optional().nullable(),
    currentUsageHours: z.coerce.number().default(0),
    notes: z.string().optional(),
    acquisitionDate: z.string().optional().nullable(),
    acquisitionCost: z.coerce.number().default(0),
    images: z.array(z.string()).default([]),
});

export async function listTools(tenantId: string, filters: { status?: string; categoryId?: string; search?: string }) {
    const conditions: SQL[] = [eq(tools.tenantId, tenantId)];

    if (filters.status) {
        conditions.push(eq(tools.status, filters.status as any));
    }

    if (filters.categoryId) {
        conditions.push(eq(tools.categoryId, filters.categoryId));
    }

    if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(or(
            ilike(tools.name, searchPattern),
            ilike(tools.brand, searchPattern),
            ilike(tools.assetTag, searchPattern),
            ilike(tools.serialNumber, searchPattern)
        ) as SQL);
    }

    return await db
        .select({
            id: tools.id,
            name: tools.name,
            brand: tools.brand,
            model: tools.model,
            serialNumber: tools.serialNumber,
            assetTag: tools.assetTag,
            dailyRate: tools.dailyRate,
            minRentalValue: tools.minRentalValue,
            cleaningFee: tools.cleaningFee,
            status: tools.status,
            lastMaintenanceAt: tools.lastMaintenanceAt,
            nextMaintenanceDueHours: tools.nextMaintenanceDueHours,
            currentUsageHours: tools.currentUsageHours,
            imageUrl: tools.imageUrl,
            images: tools.images,
            notes: tools.notes,
            acquisitionDate: tools.acquisitionDate,
            acquisitionCost: tools.acquisitionCost,
            createdAt: tools.createdAt,
            categoryId: tools.categoryId,
            categoryName: toolCategories.name,
        })
        .from(tools)
        .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
        .where(and(...conditions))
        .orderBy(desc(tools.createdAt));
}

export async function getTool(tenantId: string, id: string) {
    const [tool] = await db
        .select({
            id: tools.id,
            name: tools.name,
            brand: tools.brand,
            model: tools.model,
            serialNumber: tools.serialNumber,
            assetTag: tools.assetTag,
            dailyRate: tools.dailyRate,
            minRentalValue: tools.minRentalValue,
            cleaningFee: tools.cleaningFee,
            status: tools.status,
            lastMaintenanceAt: tools.lastMaintenanceAt,
            nextMaintenanceDueHours: tools.nextMaintenanceDueHours,
            currentUsageHours: tools.currentUsageHours,
            imageUrl: tools.imageUrl,
            images: tools.images,
            notes: tools.notes,
            acquisitionDate: tools.acquisitionDate,
            acquisitionCost: tools.acquisitionCost,
            createdAt: tools.createdAt,
            categoryId: tools.categoryId,
            categoryName: toolCategories.name,
        })
        .from(tools)
        .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
        .where(and(eq(tools.tenantId, tenantId), eq(tools.id, id)));

    if (!tool) throw new AppError(404, 'Ferramenta não encontrada');
    return tool;
}

export async function createTool(tenantId: string, data: z.infer<typeof toolSchema>) {
    // Plan enforcement
    const [tenant] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, tenantId));
    const limits = getPlanLimits(tenant?.plan);

    const [toolCount] = await db.select({ count: sql`count(*)` }).from(tools).where(eq(tools.tenantId, tenantId));
    if (Number((toolCount as any).count) >= limits.maxTools) {
        throw new AppError(403, `Limite de ferramentas atingido para o plano ${tenant?.plan || 'Essencial'} (${limits.maxTools} itens). Faça upgrade para continuar.`);
    }

    const [tool] = await db.insert(tools).values({
        tenantId,
        categoryId: data.categoryId,
        name: data.name,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        assetTag: data.assetTag,
        dailyRate: String(data.dailyRate),
        minRentalValue: String(data.minRentalValue),
        cleaningFee: String(data.cleaningFee),
        status: data.status,
        nextMaintenanceDueHours: data.nextMaintenanceDueHours ? String(data.nextMaintenanceDueHours) : null,
        currentUsageHours: String(data.currentUsageHours),
        notes: data.notes,
        acquisitionDate: data.acquisitionDate,
        acquisitionCost: String(data.acquisitionCost),
        images: data.images,
    }).returning();
    return tool;
}

export async function updateTool(tenantId: string, id: string, data: Partial<z.infer<typeof toolSchema>>) {
    const [tool] = await db
        .update(tools)
        .set({
            ...data,
            dailyRate: data.dailyRate !== undefined ? String(data.dailyRate) : undefined,
            minRentalValue: data.minRentalValue !== undefined ? String(data.minRentalValue) : undefined,
            cleaningFee: data.cleaningFee !== undefined ? String(data.cleaningFee) : undefined,
            nextMaintenanceDueHours: data.nextMaintenanceDueHours !== undefined ? (data.nextMaintenanceDueHours ? String(data.nextMaintenanceDueHours) : null) : undefined,
            currentUsageHours: data.currentUsageHours !== undefined ? String(data.currentUsageHours) : undefined,
            acquisitionCost: data.acquisitionCost !== undefined ? String(data.acquisitionCost) : undefined,
            updatedAt: new Date(),
        })
        .where(and(eq(tools.tenantId, tenantId), eq(tools.id, id)))
        .returning();
    if (!tool) throw new AppError(404, 'Ferramenta não encontrada');
    return tool;
}

export async function deleteTool(tenantId: string, id: string) {
    // Safety check: Cannot delete if tool has active rentals
    const activeRental = await db.query.rentals.findFirst({
        where: and(
            eq(rentals.tenantId, tenantId),
            eq(rentals.toolId, id),
            or(eq(rentals.status, 'active'), eq(rentals.status, 'overdue'))
        )
    });

    if (activeRental) {
        throw new AppError(400, 'Não é possível excluir uma ferramenta com locação ativa. Finalize a locação primeiro.');
    }

    // Perform physical delete
    const [deletedTool] = await db
        .delete(tools)
        .where(and(eq(tools.tenantId, tenantId), eq(tools.id, id)))
        .returning();

    if (!deletedTool) throw new AppError(404, 'Ferramenta não encontrada');
    return { success: true };
}

export async function bulkDeleteTools(tenantId: string, ids: string[]) {
    // Check if any of these tools have active rentals
    const activeRentals = await db.query.rentals.findMany({
        where: and(
            eq(rentals.tenantId, tenantId),
            inArray(rentals.toolId, ids),
            or(eq(rentals.status, 'active'), eq(rentals.status, 'overdue'))
        )
    });

    if (activeRentals.length > 0) {
        throw new AppError(400, 'Algumas das ferramentas selecionadas possuem locações ativas e não podem ser excluídas.');
    }

    await db
        .delete(tools)
        .where(and(eq(tools.tenantId, tenantId), inArray(tools.id, ids)));

    return { success: true };
}

import { calculateAssetHealth } from './intelligence.service';

export async function getTool360(tenantId: string, id: string) {
    const tool = await db.query.tools.findFirst({
        where: and(eq(tools.tenantId, tenantId), eq(tools.id, id)),
        with: {
            category: true,
            maintenanceLogs: {
                with: {
                    performedByUser: {
                        columns: {
                            fullName: true
                        }
                    }
                },
                orderBy: (logs, { desc }) => [desc(logs.maintenanceDate)],
            },
            rentals: {
                with: {
                    customer: {
                        columns: {
                            fullName: true,
                            id: true
                        }
                    }
                },
                orderBy: (rentals, { desc }) => [desc(rentals.createdAt)],
                limit: 10,
            }
        }
    });

    if (!tool) throw new AppError(404, 'Ferramenta não encontrada');

    // Calculate specific ROI for this tool
    const totalRevenue = tool.rentals.reduce((sum, r) => sum + parseFloat(r.totalAmountActual || r.totalAmountExpected || '0'), 0);
    const totalMaintenance = tool.maintenanceLogs.reduce((sum, m) => sum + parseFloat(m.cost || '0'), 0);
    const acqCost = parseFloat(tool.acquisitionCost || '0');

    // Simple ROI
    const netProfit = totalRevenue - totalMaintenance - acqCost;
    const totalCost = acqCost + totalMaintenance;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    const health = calculateAssetHealth(tool);

    return {
        ...tool,
        metrics: {
            totalRevenue,
            totalMaintenance,
            roi: roi.toFixed(1),
            netProfit: netProfit.toFixed(2),
            healthScore: health.score,
            healthStatus: health.status
        }
    };
}
