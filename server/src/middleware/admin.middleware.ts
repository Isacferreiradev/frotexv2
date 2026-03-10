import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from './error.middleware';
import logger from '../utils/logger';

/**
 * Middleware to authenticate Administrative API requests.
 * Expects X-Admin-Api-Key header.
 */
export function adminAuth(req: Request, _res: Response, next: NextFunction) {
    const apiKey = req.headers['x-admin-api-key'];

    if (!apiKey) {
        logger.warn(`[ADMIN] Access attempt without API Key from IP: ${req.ip}`);
        return next(new AppError(401, 'Administrative API Key is required'));
    }

    if (apiKey !== env.ADMIN_API_KEY) {
        logger.error(`[ADMIN] Invalid API Key attempt: ${apiKey?.toString().substring(0, 4)}... from IP: ${req.ip}`);
        return next(new AppError(401, 'Invalid Administrative API Key'));
    }

    // Success - Admin project authorized
    next();
}

/**
 * Optional: Restrict Admin origins if needed
 */
export function adminOriginLock(allowedOrigins: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const origin = req.get('origin') || req.get('referer');
        if (!origin) return next(); // server-to-server

        const isAllowed = allowedOrigins.some(o => origin.includes(o));
        if (!isAllowed) {
            logger.error(`[ADMIN] Origin blocked: ${origin}`);
            return next(new AppError(403, 'Origin not authorized for administrative access'));
        }
        next();
    };
}
