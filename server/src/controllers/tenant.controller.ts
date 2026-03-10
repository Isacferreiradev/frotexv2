import { Request, Response } from 'express';
import * as tenantService from '../services/tenant.service';
import { getSubscriptionState } from '../services/subscription.service';

export async function getInfo(req: any, res: Response) {
    const tenant = await tenantService.getTenantInfo(req.user.tenantId);
    res.json({ success: true, data: tenant });
}

export async function getTeam(req: any, res: Response) {
    const team = await tenantService.listTeam(req.user.tenantId);
    res.json({ success: true, data: team });
}
export async function updateGateway(req: any, res: Response) {
    const data = await tenantService.updateGatewaySettings(req.user.tenantId, req.body);
    res.json({ success: true, data });
}

export async function updateInfo(req: any, res: Response) {
    const data = await tenantService.updateTenantInfo(req.user.tenantId, req.body);
    res.json({ success: true, data });
}

export async function getSubscriptionStatus(req: any, res: Response) {
    const state = await getSubscriptionState(req.user.tenantId);
    res.json({ success: true, data: state });
}
