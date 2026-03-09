import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 9999 : 100,
    message: { success: false, message: 'Muitas requisições. Tente novamente em breve.' },
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 9999 : 10,
    message: { success: false, message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

export const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    message: { success: false, message: 'Limite de recuperação de senha atingido. Tente novamente em uma hora.' },
});
