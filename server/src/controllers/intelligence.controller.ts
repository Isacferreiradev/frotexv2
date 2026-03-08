import { Request, Response, NextFunction } from 'express';
import * as intelligenceService from '../services/intelligence.service';
import logger from '../utils/logger';

export async function getRoiInsights(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId; // Set by middleware
        const insights = await intelligenceService.getRoiInsights(tenantId);

        res.json({
            success: true,
            data: insights
        });
    } catch (err) { next(err); }
}

export async function getCashFlowIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const insights = await intelligenceService.getCashFlowIntelligence(tenantId);

        res.json({
            success: true,
            data: insights
        });
    } catch (err) { next(err); }
}

export async function getNewCustomers(req: Request, res: Response, next: NextFunction) {
    try {
        const { start, end } = req.query as Record<string, string>;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const data = await intelligenceService.getNewCustomersReport(req.user!.tenantId, startDate, endDate);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function getOperationalSummary(req: Request, res: Response, next: NextFunction) {
    try {
        const { start, end } = req.query as Record<string, string>;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const data = await intelligenceService.getOperationalSummary(req.user!.tenantId, startDate, endDate);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}
