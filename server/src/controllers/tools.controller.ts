import { Request, Response, NextFunction } from 'express';
import * as toolsService from '../services/tools.service';

export async function list(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const { status, categoryId, search } = req.query as Record<string, string>;
        const data = await toolsService.listTools(tenantId, { status, categoryId, search });
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await toolsService.getTool(req.user!.tenantId, req.params.id);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function get360(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await toolsService.getTool360(req.user!.tenantId, req.params.id);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
    try {
        const body = toolsService.toolSchema.parse(req.body);
        const data = await toolsService.createTool(req.user!.tenantId, body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const body = toolsService.toolSchema.partial().parse(req.body);
        const data = await toolsService.updateTool(req.user!.tenantId, req.params.id, body);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
    try {
        await toolsService.deleteTool(req.user!.tenantId, req.params.id);
        res.json({ success: true });
    } catch (err) { next(err); }
}

export async function bulkRemove(req: Request, res: Response, next: NextFunction) {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ success: false, message: 'Invalid IDs' });
        }
        await toolsService.bulkDeleteTools(req.user!.tenantId, ids);
        res.json({ success: true });
    } catch (err) { next(err); }
}
