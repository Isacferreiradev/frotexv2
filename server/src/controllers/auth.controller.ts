import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import fs from 'fs';

// Local debug log removed for production compatibility

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const data = authService.registerSchema.parse(req.body);
        const result = await authService.register(data);
        res.status(201).json({ success: true, data: result });
    } catch (err: any) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const data = authService.loginSchema.parse(req.body);
        const result = await authService.login(data);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'refreshToken obrigatório' });
        }
        const result = await authService.refreshTokens(refreshToken);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function me(req: Request, res: Response) {
    res.json({ success: true, data: req.user });
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) throw new AppError(401, 'Não autenticado');
        const data = authService.updatePasswordSchema.parse(req.body);
        const result = await authService.updatePassword(req.user.userId, data);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.user) throw new AppError(401, 'Não autenticado');
        const result = await authService.updateProfile(req.user.userId, req.body);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function verify(req: Request, res: Response, next: NextFunction) {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            throw new AppError(400, 'Token de verificação obrigatório');
        }
        const result = await authService.verifyEmail(token);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function requestReset(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = authService.requestResetSchema.parse(req.body);
        const result = await authService.requestPasswordReset(email);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const data = authService.resetPasswordSchema.parse(req.body);
        const result = await authService.resetPassword(data);
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

