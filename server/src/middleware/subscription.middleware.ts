import { Request, Response, NextFunction } from 'express';
import { checkLimit, hasFeature } from '../services/subscription.service';
import { PlanLimits } from '../config/plans';

/**
 * Middleware factory: blocks the request if the tenant does not have a specific feature.
 *
 * Usage: router.post('/reports', authenticate, requireFeature('reports'), handler)
 */
export function requireFeature(feature: keyof PlanLimits['features']) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const tenantId = (req as any).tenantId;

        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Tenant não identificado' });
        }

        const result = await hasFeature(tenantId, feature);

        if (!result.allowed) {
            return res.status(403).json({
                success: false,
                code: result.code,
                message: result.reason,
            });
        }

        next();
    };
}

/**
 * Middleware factory: blocks the request if the tenant has reached the limit for a resource.
 * Use this BEFORE creation endpoints.
 *
 * Usage: router.post('/tools', authenticate, enforceLimit('tools'), handler)
 */
export function enforceLimit(resource: 'tools' | 'customers' | 'rentals' | 'users') {
    return async (req: Request, res: Response, next: NextFunction) => {
        const tenantId = (req as any).tenantId;

        if (!tenantId) {
            return res.status(401).json({ success: false, message: 'Tenant não identificado' });
        }

        const result = await checkLimit(tenantId, resource);

        if (!result.allowed) {
            return res.status(403).json({
                success: false,
                code: result.code,
                message: result.reason,
            });
        }

        next();
    };
}
