import { Request, Response, NextFunction } from 'express';
import * as automationService from '../services/automation.service';
import { sendWhatsAppMessage } from '../services/whatsapp.service';
import { z } from 'zod';
import { EvolutionService } from '../services/evolution.service';
import { db } from '../db';
import { storeAutomationSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

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

export async function connectWhatsApp(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const instanceName = `tenant_${tenantId.replace(/-/g, '')}`;

        const evo = new EvolutionService();
        // Generates or connects the instance
        const response: any = await evo.connectInstance(instanceName);

        // Update settings in database
        await db.update(storeAutomationSettings)
            .set({
                whatsappInstanceName: instanceName,
                whatsappInstanceStatus: 'connecting',
                updatedAt: new Date()
            })
            .where(eq(storeAutomationSettings.tenantId, tenantId));

        res.json({ success: true, qr: response?.base64 || response?.qrcode, instanceName });
    } catch (err) { next(err); }
}

export async function getWhatsAppStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;

        const settings = await db.query.storeAutomationSettings.findFirst({
            where: eq(storeAutomationSettings.tenantId, tenantId)
        });

        if (!settings?.whatsappInstanceName) {
            return res.json({ success: true, status: 'disconnected' });
        }

        const evo = new EvolutionService();
        const stateData: any = await evo.getConnectionState(settings.whatsappInstanceName);

        const state = stateData?.instance?.state || stateData?.state; // Handles different Evolution versions

        if (state === 'open') {
            await db.update(storeAutomationSettings)
                .set({ whatsappInstanceStatus: 'connected', whatsappEnabled: true, updatedAt: new Date() })
                .where(eq(storeAutomationSettings.tenantId, tenantId));
            return res.json({ success: true, status: 'connected' });
        }

        res.json({ success: true, status: 'connecting' });
    } catch (err) { next(err); }
}

export async function disconnectWhatsApp(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const settings = await db.query.storeAutomationSettings.findFirst({
            where: eq(storeAutomationSettings.tenantId, tenantId)
        });

        if (settings?.whatsappInstanceName) {
            try {
                const evo = new EvolutionService();
                await evo.logoutInstance(settings.whatsappInstanceName);
            } catch (e) {
                logger.warn(`Could not cleanly logout instance on Evolution: ${e}`);
            }

            await db.update(storeAutomationSettings)
                .set({
                    whatsappInstanceName: null,
                    whatsappInstanceStatus: 'disconnected',
                    whatsappEnabled: false,
                    updatedAt: new Date()
                })
                .where(eq(storeAutomationSettings.tenantId, tenantId));
        }

        res.json({ success: true, message: 'WhatsApp disconnected' });
    } catch (err) { next(err); }
}
