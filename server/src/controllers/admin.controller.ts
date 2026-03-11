import { Request, Response, NextFunction } from 'express';
import { AdminDataService } from '../services/admin.service';
import { AdminMetricsService } from '../services/admin-metrics.service';
import { AdminActionsService } from '../services/admin-actions.service';
import { AdminEntitiesService } from '../services/admin-entities.service';
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

// ==========================================
// METRICS (OVERVIEWS & FUNNELS)
// ==========================================

export async function getOverview(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminMetricsService.getGlobalOverview();
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Global Overview failed:`, err);
        next(err);
    }
}

export async function getActivationFunnel(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminMetricsService.getActivationFunnel();
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Activation Funnel failed:`, err);
        next(err);
    }
}

// ==========================================
// TENANTS (READ)
// ==========================================

export async function listTenants(req: Request, res: Response, next: NextFunction) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const plan = req.query.plan as string;
        const status = req.query.status as string;
        const sort = req.query.sort as string;
        const sortDirection = req.query.sortDirection as 'asc' | 'desc';

        const { data, total } = await AdminDataService.listTenants({
            page, limit, search, plan, status, sort, sortDirection
        });

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
        const data = await AdminDataService.getTenantAdminDetails(id);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Tenant details failed for ${req.params.id}:`, err);
        next(err);
    }
}

// ==========================================
// MUTATIONS (ACTIONS)
// ==========================================

export async function updateTenant(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const { plan, subscriptionStatus, isManualLock, lockReason } = req.body;

        const data = await AdminActionsService.updateTenant(id, {
            plan,
            subscriptionStatus,
            isManualLock,
            lockReason
        });

        sendSuccess(res, data, { message: 'Tenant updated successfully' });
    } catch (err) {
        logger.error(`[ADMIN] Update tenant failed for ${req.params.id}:`, err);
        next(err);
    }
}

export async function deleteTenant(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const data = await AdminActionsService.deleteTenant(id);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Delete tenant failed for ${req.params.id}:`, err);
        next(err);
    }
}

// ==========================================
// USERS & SUBSCRIPTIONS
// ==========================================

export async function listUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const { data, total } = await AdminDataService.listUsers({ page, limit, search });

        sendSuccess(res, data, {
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        logger.error(`[ADMIN] List users failed:`, err);
        next(err);
    }
}

export async function listSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const plan = req.query.plan as string;
        const status = req.query.status as string;

        const { data, total } = await AdminDataService.listSubscriptions({ page, limit, plan, status });

        sendSuccess(res, data, {
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        logger.error(`[ADMIN] List subscriptions failed:`, err);
        next(err);
    }
}

// ==========================================
// ENTITIES "DEUS MODE" (CROSS-TENANT)
// ==========================================

// Users
export async function updateAnyUser(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.updateUser(req.params.id, req.body);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Update user failed for ${req.params.id}:`, err);
        next(err);
    }
}

export async function deleteAnyUser(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.deleteUser(req.params.id);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Delete user failed for ${req.params.id}:`, err);
        next(err);
    }
}

// Tools
export async function listAllTools(req: Request, res: Response, next: NextFunction) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const { search, tenantId, status } = req.query as any;

        const { data, total } = await AdminEntitiesService.listTools({ page, limit, search, tenantId, status });
        sendSuccess(res, data, { total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        logger.error(`[ADMIN] List all tools failed:`, err);
        next(err);
    }
}

export async function updateAnyTool(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.updateTool(req.params.id, req.body);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Update tool failed for ${req.params.id}:`, err);
        next(err);
    }
}

export async function deleteAnyTool(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.deleteTool(req.params.id);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Delete tool failed for ${req.params.id}:`, err);
        next(err);
    }
}

// Customers
export async function listAllCustomers(req: Request, res: Response, next: NextFunction) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const { search, tenantId } = req.query as any;

        const { data, total } = await AdminEntitiesService.listCustomers({ page, limit, search, tenantId });
        sendSuccess(res, data, { total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        logger.error(`[ADMIN] List all customers failed:`, err);
        next(err);
    }
}

export async function updateAnyCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.updateCustomer(req.params.id, req.body);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Update customer failed for ${req.params.id}:`, err);
        next(err);
    }
}

export async function deleteAnyCustomer(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.deleteCustomer(req.params.id);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Delete customer failed for ${req.params.id}:`, err);
        next(err);
    }
}

// Rentals
export async function listAllRentals(req: Request, res: Response, next: NextFunction) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const { search, tenantId, status } = req.query as any;

        const { data, total } = await AdminEntitiesService.listRentals({ page, limit, search, tenantId, status });
        sendSuccess(res, data, { total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
        logger.error(`[ADMIN] List all rentals failed:`, err);
        next(err);
    }
}

export async function updateAnyRental(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.updateRental(req.params.id, req.body);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Update rental failed for ${req.params.id}:`, err);
        next(err);
    }
}

export async function deleteAnyRental(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await AdminEntitiesService.deleteRental(req.params.id);
        sendSuccess(res, data);
    } catch (err) {
        logger.error(`[ADMIN] Delete rental failed for ${req.params.id}:`, err);
        next(err);
    }
}
