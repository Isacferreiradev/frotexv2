import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * Middleware to restrict access to System Administrators (SuperAdmins)
 * Depends on the `authenticate` middleware being called first to populate `req.user`.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
        return next(new AppError(401, 'Autenticação necessária'));
    }

    if (req.user.systemRole !== 'admin') {
        return next(new AppError(403, 'Acesso negado: Requer privilégios de Administrador do Sistema'));
    }

    next();
}
