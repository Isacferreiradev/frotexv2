import { Request, Response, NextFunction } from 'express';
import * as quotesService from '../services/quotes.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const data = await quotesService.listQuotes(tenantId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const data = await quotesService.createQuote(tenantId, req.body);
        res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { id } = req.params;
        const { status } = req.body;
        const data = await quotesService.updateQuoteStatus(tenantId, id, status);
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { id } = req.params;
        const data = await quotesService.getQuote(tenantId, id);
        if (!data) return res.status(404).json({ success: false, message: 'Orçamento não encontrado' });
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

export const convert = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.id;
        const { id } = req.params;
        const data = await quotesService.convertToRental(tenantId, id, userId);
        res.json({ success: true, data });
    } catch (err) { next(err); }
};
