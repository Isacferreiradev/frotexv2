import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, tools, customers, rentals } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';

export async function getStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const userId = req.user!.userId;

        // Check user status
        const [user] = await db.select({ hasOnboarded: users.hasOnboarded }).from(users).where(eq(users.id, userId));

        // Check completion of steps
        const [toolsCount] = await db.select({ count: sql`count(*)` }).from(tools).where(eq(tools.tenantId, tenantId));
        const [customersCount] = await db.select({ count: sql`count(*)` }).from(customers).where(eq(customers.tenantId, tenantId));
        const [rentalsCount] = await db.select({ count: sql`count(*)` }).from(rentals).where(eq(rentals.tenantId, tenantId));

        res.json({
            success: true,
            data: {
                hasOnboarded: user?.hasOnboarded ?? false,
                steps: {
                    toolCreated: Number((toolsCount as any).count) > 0,
                    customerCreated: Number((customersCount as any).count) > 0,
                    rentalCreated: Number((rentalsCount as any).count) > 0
                },
                progress: {
                    completed: [
                        Number((toolsCount as any).count) > 0,
                        Number((customersCount as any).count) > 0,
                        Number((rentalsCount as any).count) > 0
                    ].filter(Boolean).length,
                    total: 3
                }
            }
        });
    } catch (err) { next(err); }
}

export async function finishOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        await db.update(users)
            .set({ hasOnboarded: true, updatedAt: new Date() })
            .where(eq(users.id, userId));

        res.json({ success: true, message: 'Onboarding concluído com sucesso' });
    } catch (err) { next(err); }
}
