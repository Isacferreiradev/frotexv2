import { Router } from 'express';
import { BillingService } from '../services/billing/billing.service';
import { authenticate } from '../middleware/auth.middleware';
import { db } from '../db';
import { billingCharges } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * POST /api/billing/upgrade
 * Initiate a plan upgrade
 */
router.post('/upgrade', authenticate, async (req: any, res, next) => {
    try {
        const { planRequested } = req.body;
        const tenantId = req.user.tenantId;
        const userId = req.user.id;

        if (!['pro', 'premium', 'scale'].includes(planRequested)) {
            throw new AppError(400, 'Plano inválido selecionado.');
        }

        const charge = await BillingService.initiateUpgrade(tenantId, userId, planRequested);

        res.status(201).json({
            success: true,
            data: charge
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/charge/:id
 * Get status of a specific charge (for polling)
 */
router.get('/charge/:id', authenticate, async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const charge = await db.query.billingCharges.findFirst({
            where: (charges, { and, eq }) => and(
                eq(charges.id, id),
                eq(charges.tenantId, tenantId)
            )
        });

        if (!charge) {
            throw new AppError(404, 'Cobrança não encontrada.');
        }

        res.json({
            success: true,
            data: {
                status: charge.status,
                planRequested: charge.planRequested
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
