import { Request, Response } from 'express';
import * as intelligenceService from '../services/intelligence.service';

export async function getRoiInsights(req: Request, res: Response) {
    try {
        const tenantId = req.user!.tenantId; // Set by middleware
        const insights = await intelligenceService.getRoiInsights(tenantId);

        res.json({
            success: true,
            data: insights
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar insights de inteligência'
        });
    }
}

export async function getCashFlowIntelligence(req: Request, res: Response) {
    try {
        const tenantId = req.user!.tenantId;
        const insights = await intelligenceService.getCashFlowIntelligence(tenantId);

        res.json({
            success: true,
            data: insights
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao buscar inteligência de fluxo de caixa'
        });
    }
}

export async function getNewCustomers(req: Request, res: Response) {
    try {
        const { start, end } = req.query as Record<string, string>;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const data = await intelligenceService.getNewCustomersReport(req.user!.tenantId, startDate, endDate);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getOperationalSummary(req: Request, res: Response) {
    try {
        const { start, end } = req.query as Record<string, string>;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const data = await intelligenceService.getOperationalSummary(req.user!.tenantId, startDate, endDate);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
