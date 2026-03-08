import { Request, Response, NextFunction } from 'express';
import * as rentalsService from '../services/rentals.service';

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const { status, search } = req.query as Record<string, string>;
        const data = await rentalsService.listRentals(req.user!.tenantId, { status, search });
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await rentalsService.getRental(req.user!.tenantId, req.params.id);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = rentalsService.createRentalSchema.parse(req.body);
        const data = await rentalsService.createRental(req.user!.tenantId, req.user!.userId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function checkin(req: Request, res: Response, next: NextFunction) {
    try {
        const body = rentalsService.checkinSchema.parse(req.body);
        const data = await rentalsService.checkinRental(req.user!.tenantId, req.params.id, req.user!.userId, body);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await rentalsService.cancelRental(req.user!.tenantId, req.params.id);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function dashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
        const { period } = req.query as { period?: string };
        const data = await rentalsService.getDashboardStats(req.user!.tenantId, period);

        console.log(`[DASHBOARD] stats for tenant: ${req.user!.tenantId}, period: ${period}`);
        console.log(`[DASHBOARD] revenueThisMonth: ${data.revenueThisMonth}`);

        res.json({ success: true, data });
    } catch (err) { next(err); }
}
export const getAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { toolId } = req.params;
        const tenantId = (req as any).user.tenantId;

        const data = await rentalsService.getToolAvailability(tenantId, toolId);
        res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
};

export async function listExpiring(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await rentalsService.getExpiringRentals(req.user!.tenantId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}
