import { Request, Response } from 'express';
import * as alertsService from '../services/alerts.service';
import logger from '../utils/logger';

export async function getAlerts(req: Request, res: Response) {
    try {
        const tenantId = (req as any).user.tenantId;
        const alerts = await alertsService.getActiveAlerts(tenantId);
        return res.json({ success: true, data: alerts });
    } catch (error) {
        logger.error('Error fetching alerts:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar alertas' });
    }
}

export async function dismissAlerts(req: Request, res: Response) {
    try {
        const tenantId = (req as any).user.tenantId;
        const { alertIds } = req.body;
        if (!Array.isArray(alertIds)) {
            return res.status(400).json({ success: false, message: 'Invalid alert IDs' });
        }
        await alertsService.dismissAlerts(tenantId, alertIds);
        return res.json({ success: true });
    } catch (error) {
        logger.error('Error dismissing alerts:', error);
        return res.status(500).json({ success: false, message: 'Erro ao dispensar alertas' });
    }
}
