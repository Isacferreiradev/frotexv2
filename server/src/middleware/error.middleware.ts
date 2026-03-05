import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

// Drizzle wraps the underlying pg error — extract it from .cause
function getPgCode(err: any): string | undefined {
    return err?.code ?? err?.cause?.code;
}

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    console.error('🔥 [GLOBAL ERROR HANDLER]', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack,
        pgCode: getPgCode(err),
        body: req.body
    });

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: err.flatten().fieldErrors,
        });
    }

    const pgCode = getPgCode(err);

    // PostgreSQL unique violation
    if (pgCode === '23505') {
        const detail: string = (err as any)?.cause?.detail ?? (err as any)?.detail ?? '';
        // Give friendlier messages based on which column conflicted
        let message = 'Registro duplicado';
        if (detail.includes('email')) message = 'Este e-mail já está cadastrado';
        else if (detail.includes('name')) message = 'Já existe uma locadora com este nome';
        else if (detail.includes('document_number') || detail.includes('cpf') || detail.includes('cnpj'))
            message = 'Documento já cadastrado';
        return res.status(409).json({ success: false, message });
    }

    // PostgreSQL foreign key violation
    if (pgCode === '23503') {
        return res.status(409).json({
            success: false,
            message: 'Referência inválida',
        });
    }

    // PostgreSQL not-null violation
    if (pgCode === '23502') {
        const column: string = (err as any)?.cause?.column ?? (err as any)?.column ?? 'campo';
        return res.status(400).json({
            success: false,
            message: `Campo obrigatório: ${column}`,
        });
    }

    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
    });
}
