import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import logger from '../utils/logger';

/**
 * Global API response wrapper for consistency
 */
function sendSuccess(res: Response, data: any, meta?: any) {
    res.json({
        success: true,
        data,
        meta
    });
}

export async function getOverview(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await adminService.getSaaSOverview();
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Overview failed:`, err);
        next(err);
    }
}

export async function listTenants(req: Request, res: Response, next: NextFunction) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const plan = req.query.plan as string;

        const { data, total } = await adminService.listTenants({ page, limit, search, plan });

        sendSuccess(res, data, {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        logger.error(`[ADMIN] List tenants failed:`, err);
        next(err);
    }
}

export async function getTenantDetails(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const data = await adminService.getTenantAdminDetails(id);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Tenant details failed for ${req.params.id}:`, err);
        next(err);
    }
}
