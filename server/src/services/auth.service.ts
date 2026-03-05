import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, tenants } from '../db/schema';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';

export const registerSchema = z.object({
    // Step 1: Account
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    fullName: z.string().min(2, 'Nome completo obrigatório'),

    // Step 2: Company
    tenantName: z.string().min(2, 'Nome da locadora obrigatório'),
    documentNumber: z.string().min(11, 'Documento inválido'),
    phoneNumber: z.string().min(10, 'Telefone inválido'),
    city: z.string().min(2, 'Cidade obrigatória'),
    state: z.string().length(2, 'Estado (UF) deve ter 2 caracteres'),

    // Step 3: Profile
    toolCountRange: z.string().optional(),
    currentControlMethod: z.string().optional(),
    activeRentalsRange: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const requestResetSchema = z.object({
    email: z.string().email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token obrigatório'),
    password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});

export async function register(data: z.infer<typeof registerSchema>) {
    console.log(`[AUTH] Iniciando registro profissional Locattus para: ${data.email}`);
    try {
        const email = data.email.toLowerCase().trim();
        const result = await db.transaction(async (tx) => {
            // 1. Create tenant with operational profile
            const [tenant] = await tx.insert(tenants).values({
                name: data.tenantName,
                cnpj: data.documentNumber,
                phoneNumber: data.phoneNumber,
                city: data.city,
                state: data.state,
                operationalProfile: {
                    toolCountRange: data.toolCountRange || null,
                    currentControlMethod: data.currentControlMethod || null,
                    activeRentalsRange: data.activeRentalsRange || null,
                },
            }).returning();

            // 2. Hash password and create owner user
            const verificationToken = uuidv4();
            const passwordHash = await bcrypt.hash(data.password, 12);

            const [user] = await tx.insert(users).values({
                tenantId: tenant.id,
                email: email, // Use the lowercased email variable
                passwordHash,
                fullName: data.fullName,
                role: 'owner',
                isVerified: false,
                verificationToken: verificationToken,
            }).returning();

            return { user, tenant };
        });

        // Send verification email
        sendVerificationEmail(result.user.email, result.user.fullName, result.user.verificationToken!)
            .catch(e => console.error('[AUTH-EMAIL-ERROR] Background email failed:', e));

        return {
            user: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.user.fullName,
                role: result.user.role,
                tenantId: result.tenant.id,
                isVerified: result.user.isVerified
            }
        };
    } catch (error: any) {
        throw error;
    }
}

export async function verifyEmail(token: string) {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));

    if (!user) {
        throw new AppError(400, 'Token de verificação inválido ou expirado');
    }

    if (user.isVerified) {
        return { success: true, message: 'E-mail já verificado' };
    }

    await db.update(users)
        .set({ isVerified: true, verificationToken: null })
        .where(eq(users.id, user.id));

    return { success: true, message: 'E-mail verificado com sucesso' };
}

export async function checkVerification(email: string) {
    const userEmail = email.toLowerCase().trim();
    const [user] = await db.select({ isVerified: users.isVerified }).from(users).where(sql`lower(${users.email}) = ${userEmail}`);
    if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
    }
    return user.isVerified;
}

export async function resendVerification(email: string) {
    const userEmail = email.toLowerCase().trim();
    console.log(`📧 [AUTH-SERVICE] Looking for user with email: ${userEmail}`);
    // Use case-insensitive search
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${userEmail}`);

    if (!user) {
        console.warn(`📧 [AUTH-SERVICE] User not found during resend for: ${userEmail}`);
        // For security, don't reveal if user doesn't exist, but return a clear message for logs
        return { success: true, message: 'Se o e-mail estiver cadastrado, um novo link será enviado.' };
    }

    console.log(`📧 [AUTH-SERVICE] User found: ${user.id} (${user.fullName}). Verified? ${user.isVerified}`);

    if (user.isVerified) {
        console.warn(`📧 [AUTH-SERVICE] User ${userEmail} is already verified.`);
        throw new AppError(400, 'Este e-mail já foi verificado.');
    }

    let token = user.verificationToken;
    if (!token) {
        token = uuidv4();
        await db.update(users).set({ verificationToken: token }).where(eq(users.id, user.id));
    }

    await sendVerificationEmail(user.email, user.fullName, token);

    return { success: true, message: 'Link de verificação reenviado com sucesso.' };
}

export async function login(data: z.infer<typeof loginSchema>) {
    const email = data.email.toLowerCase().trim();
    console.log(`[AUTH] Tentativa de login para: ${email}`);
    try {
        const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`);

        if (!user) {
            console.warn(`[AUTH] Usuário não encontrado: ${data.email}`);
            throw new AppError(401, 'Credenciais inválidas');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            console.warn(`[AUTH] Senha inválida para: ${data.email}`);
            throw new AppError(401, 'Credenciais inválidas');
        }

        if (!user.isVerified) {
            console.warn(`[AUTH] Usuário não verificado: ${email}`);
            throw new AppError(403, 'Por favor, verifique seu e-mail antes de fazer login');
        }

        console.log(`[AUTH] Assinando tokens para: ${user.id}`);
        const accessToken = signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        });

        const refreshToken = signRefreshToken({ userId: user.id, tenantId: user.tenantId });

        console.log(`[AUTH] Atualizando último login...`);
        await db.update(users)
            .set({ lastLoginAt: new Date(), lastActiveAt: new Date() })
            .where(eq(users.id, user.id));

        console.log(`[AUTH] Login bem-sucedido: ${user.id}`);
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                tenantId: user.tenantId,
            },
            accessToken,
            refreshToken,
        };
    } catch (error: any) {
        console.error(`[AUTH-CRITICAL] Falha no login para ${data.email}:`, error);
        throw error;
    }
}

export async function refreshTokens(token: string) {
    try {
        const payload = verifyRefreshToken(token);
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId));

        if (!user) {
            throw new AppError(401, 'Usuário não encontrado');
        }

        const accessToken = signAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        });

        const refreshToken = signRefreshToken({ userId: user.id, tenantId: user.tenantId });

        // Update last active
        await db.update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.id, user.id));

        return { accessToken, refreshToken };
    } catch (err) {
        throw new AppError(401, 'Refresh token inválido');
    }
}

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
});

export async function updatePassword(userId: string, data: z.infer<typeof updatePasswordSchema>) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw new AppError(400, 'Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return { success: true };
}

export async function requestPasswordReset(email: string) {
    const userEmail = email.toLowerCase().trim();
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${userEmail}`);

    // For security, don't reveal if user exists
    if (!user) return { success: true };

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await db.update(users)
        .set({ resetToken, resetTokenExpires })
        .where(eq(users.id, user.id));

    try {
        await sendPasswordResetEmail(user.email, user.fullName, resetToken);
    } catch (e) {
        console.error('Failed to send reset email', e);
    }

    return { success: true };
}

export async function resetPassword(data: z.infer<typeof resetPasswordSchema>) {
    const [user] = await db.select()
        .from(users)
        .where(eq(users.resetToken, data.token));

    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
        throw new AppError(400, 'Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.update(users)
        .set({
            passwordHash,
            resetToken: null,
            resetTokenExpires: null,
            updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

    return { success: true };
}

export async function updateProfile(userId: string, data: any) {
    const [updated] = await db.update(users)
        .set({
            fullName: data.fullName,
            email: data.email,
            avatarUrl: data.avatarUrl,
            hasOnboarded: data.hasOnboarded,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
    return updated;
}
