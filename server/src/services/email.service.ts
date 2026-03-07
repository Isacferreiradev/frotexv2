/* eslint-disable no-console */
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

// Initialize transporter conditionally
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
    logger.info(`📧 [SMTP-DEBUG] IngetTransporter: Singleton Check...`);
    if (transporter) return transporter;

    if (env.SMTP_USER && env.SMTP_PASS) {
        logger.info(`📧 [SMTP] Initializing transporter via ${env.SMTP_HOST}`);
        // Use real credentials
        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        try {
            logger.info(`📧 [SMTP] Verifying Connection...`);
            await transporter.verify();
            logger.info(`✅ [SMTP] Connection verified`);
        } catch (error: any) {
            logger.error(`❌ [SMTP] Verification FAILED:`, {
                code: error.code
            });
            transporter = null;
            throw error;
        }
    } else {
        logger.warn(`📧 [SMTP] No Credentials! Falling back to Ethereal...`);
        // Mock email using ethereal
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        logger.info('Using Ethereal mock email for development');
    }

    return transporter as nodemailer.Transporter;
}

// Configuration Constants
const FROM_NAME = "Locattus";
const DEFAULT_FROM = "notificacoes@locattus.com.br";

function getFromEmail() {
    let from = env.SMTP_USER || DEFAULT_FROM;
    if (from === 'apikey' || !from.includes('@')) {
        return DEFAULT_FROM;
    }
    return from;
}

async function sendEmailViaResend(to: string, subject: string, html: string) {
    if (!env.RESEND_API_KEY) return false;

    try {
        logger.info(`📧 [RESEND] Attempting delivery to ${to}...`);
        const fromEmail = getFromEmail();

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY!}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${FROM_NAME} <${fromEmail}>`,
                to,
                subject,
                html,
            }),
        });

        const data: any = await response.json();
        if (response.ok) {
            logger.info(`✅ [RESEND] Success! ID: ${data.id}`);
            return true;
        }
        logger.error(`❌ [RESEND] API Error:`, data);
        return false;
    } catch (error) {
        logger.error(`❌ [RESEND] Network Error:`, error);
        return false;
    }
}

async function sendEmail(to: string, subject: string, html: string) {
    // 1. Try Resend (Modern API)
    const resendSuccess = await sendEmailViaResend(to, subject, html);
    if (resendSuccess) return true;

    // 2. Fallback to SMTP (Traditional)
    try {
        const mailTransporter = await getTransporter();
        const fromEmail = getFromEmail();

        const info = await mailTransporter.sendMail({
            from: `"${FROM_NAME}" <${fromEmail}>`,
            to,
            subject,
            html,
        });

        logger.info(`✅ [SMTP] Delivered to ${to}. ID: ${info.messageId}`);
        if (!env.SMTP_USER) logger.info(`📧 Ethereal URL: ${nodemailer.getTestMessageUrl(info)}`);
        return true;
    } catch (error) {
        logger.error(`❌ [EMAIL-CRITICAL] All providers failed for ${to}:`, error);
        return false;
    }
}

export async function sendVerificationEmail(email: string, fullName: string, token: string) {
    const verificationUrl = `${env.CORS_ORIGIN}/verify?token=${token}`;
    const subject = 'Confirme seu e-mail - Locattus';
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #7c3aed;">Bem-vindo ao Locattus, ${fullName}!</h2>
            <p>Ficamos felizes em ter você conosco. Para começar a gerenciar sua locadora, precisamos apenas que você confirme seu e-mail.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${verificationUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Confirmar E-mail
                </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Você recebeu este e-mail porque se cadastrou no Locattus. Se não foi você, pode ignorar esta mensagem.</p>
        </div>
    `;

    return await sendEmail(email, subject, html);
}

export async function sendPasswordResetEmail(email: string, fullName: string, token: string) {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
    const subject = 'Recupere sua senha - Locattus';
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #7c3aed;">Recuperação de Senha</h2>
            <p>Olá ${fullName}, recebemos uma solicitação para redefinir a sua senha no Locattus.</p>
            <p>Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${resetUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Redefinir Senha
                </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="color: #64748b; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Se você não solicitou a alteração da senha, pode ignorar este e-mail com segurança. Sua senha não será alterada até que você acesse o link acima.</p>
        </div>
    `;

    return await sendEmail(email, subject, html);
}
