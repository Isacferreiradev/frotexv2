import { Request, Response, NextFunction } from 'express';
import * as automationService from '../services/automation.service';
import { sendWhatsAppMessage } from '../services/whatsapp.service';
import { z } from 'zod';

const updateSettingsSchema = z.object({
    whatsappEnabled: z.boolean().optional(),
    notifyOnDueDate: z.boolean().optional(),
    daysAfterDue: z.number().int().min(0).optional(),
    finePerDay: z.coerce.number().min(0).optional(),
    messageTemplate: z.string().min(1).optional(),
});

export async function getSettings(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await automationService.getAutomationSettings(req.user!.tenantId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
        const body = updateSettingsSchema.parse(req.body);
        const data = {
            ...body,
            finePerDay: body.finePerDay !== undefined ? body.finePerDay.toString() : undefined,
        };
        const result = await automationService.updateAutomationSettings(req.user!.tenantId, data as any);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function sendTestMessage(req: Request, res: Response, next: NextFunction) {
    try {
        const { phone, message } = z.object({
            phone: z.string(),
            message: z.string(),
        }).parse(req.body);

        const result = await sendWhatsAppMessage(phone, message);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function triggerCheck(req: Request, res: Response, next: NextFunction) {
    try {
        // This is for manual triggering during testing
        await automationService.checkOverdueRentals();
        res.json({ success: true, message: 'Overdue check triggered manually' });
    } catch (err) { next(err); }
}
