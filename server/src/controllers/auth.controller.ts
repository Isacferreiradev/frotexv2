import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
}

// Local debug log removed for production compatibility

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const data = authService.registerSchema.parse(req.body);

        // Honeypot check for bots
        if ((req.body as any).website) {
            logger.warn(`🤖 [AUTH-CONTROLLER] Bot detected via honeypot field: ${(req.body as any).website}`);
            return res.status(201).json({ success: true, data: { id: 'bot-blocked' } }); // Fake success
        }

        const result = await authService.register(data);
        res.status(201).json({ success: true, data: { user: result.user } });
    } catch (err: any) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const data = authService.loginSchema.parse(req.body);
        const result = await authService.login(data);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        res.json({ success: true, data: { user: result.user } });
    } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        let refreshToken = req.body.refreshToken;
        if (!refreshToken && req.headers.cookie) {
            const match = req.headers.cookie.match(/(?:^|; )refresh_token=([^;]*)/);
            if (match) refreshToken = match[1];
        }
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'refreshToken obrigatório' });
        }
        const result = await authService.refreshTokens(refreshToken);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        res.json({ success: true });
    } catch (err) { next(err); }
}

export async function me(req: Request, res: Response) {
    res.json({ success: true, data: req.user });
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ success: true, message: 'Logout efetuado com segurança' });
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

export async function checkVerification(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            throw new AppError(400, 'E-mail obrigatório');
        }
        const isVerified = await authService.checkVerification(email);
        res.json({ success: true, data: { isVerified } });
    } catch (err) { next(err); }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
    logger.info(`📧 [AUTH-CONTROLLER] Resend verification requested for: ${req.body.email}`);
    try {
        const { email } = req.body;
        if (!email) {
            logger.warn(`📧 [AUTH-CONTROLLER] Resend failed: Email is missing`);
            throw new AppError(400, 'E-mail obrigatório');
        }
        const result = await authService.resendVerification(email);
        logger.info(`📧 [AUTH-CONTROLLER] Resend service completed for ${email}`);
        res.json({ success: true, data: result });
    } catch (err) {
        logger.error(`📧 [AUTH-CONTROLLER] Resend error:`, err);
        next(err);
    }
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

