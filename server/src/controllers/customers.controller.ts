import { Request, Response, NextFunction } from 'express';
import * as customersService from '../services/customers.service';

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const { search } = req.query as Record<string, string>;
        const isBlocked = req.query.isBlocked !== undefined ? req.query.isBlocked === 'true' : undefined;
        const data = await customersService.listCustomers(tenantId, { isBlocked, search });
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await customersService.getCustomer(req.user!.tenantId, req.params.id);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function get360(req: Request, res: Response, next: NextFunction) {
    try {
        console.log(`[DEBUG] get360 - tenantId: ${req.user!.tenantId}, customerId: ${req.params.id}`);
        const data = await customersService.getCustomer360(req.user!.tenantId, req.params.id);
        res.json({ success: true, data });
    } catch (err) {
        console.error(`[ERROR] get360 failed:`, err);
        next(err);
    }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = customersService.customerSchema.parse(req.body);
        const data = await customersService.createCustomer(req.user!.tenantId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const body = customersService.customerSchema.partial().parse(req.body);
        const data = await customersService.updateCustomer(req.user!.tenantId, req.params.id, body);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        await customersService.deleteCustomer(req.user!.tenantId, req.params.id);
        res.json({ success: true });
    } catch (err) { next(err); }
}
