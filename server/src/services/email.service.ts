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

async function sendEmailViaResend(to: string, subject: string, html: string) {
    if (!env.RESEND_API_KEY) return false;

    try {
        logger.info(`📧 [RESEND] Attempting API delivery to ${to}...`);

        // Use the verified domain email address
        const fromEmail = env.RESEND_FROM_EMAIL || "notificacoes@locattus.com";

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY!}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `Locattus <${fromEmail}>`,
                to,
                subject,
                html,
            }),
        });

        const data: any = await response.json();

        if (response.ok) {
            logger.info(`✅ [RESEND] Success! MessageId: ${data.id}`);
            return true;
        } else {
            logger.error(`❌ [RESEND] API Error:`, data);
            return false;
        }
    } catch (error) {
        logger.error(`❌ [RESEND] Network Error:`, error);
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

    logger.info(`📧 Sending verification email to ${email.split('@')[0]}@...`);

    // Try Resend first
    const resendSuccess = await sendEmailViaResend(email, subject, html);
    if (resendSuccess) return;

    // Fallback to SMTP
    try {
        logger.info(`📧 [SMTP-DEBUG] Step 1: Getting Transporter in sendVerificationEmail...`);
        const mailTransporter = await getTransporter();

        // Ensure fromEmail is a valid email format
        let fromEmail = env.SMTP_USER || 'no-reply@locattus.com';
        if (fromEmail === 'apikey' || !fromEmail.includes('@')) {
            fromEmail = 'notificacoes@locattus.com';
        }

        const fromName = "Locattus";

        logger.info(`📧 [SMTP-DEBUG] Step 2: Sending mail to ${email}...`);
        const info = await mailTransporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject,
            html,
        });

        logger.info(`✅ Verification email delivered to ${email}. MessageId: ${info.messageId}`);

        if (!env.SMTP_USER) {
            logger.info(`📧 Ethereal URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error('Error sending verification email via SMTP:', error);
        throw new Error('Falha ao enviar e-mail via SMTP');
    }
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

    logger.info(`🔑 Sending password reset email to ${email.split('@')[0]}@...`);

    // Try Resend first
    const resendSuccess = await sendEmailViaResend(email, subject, html);
    if (resendSuccess) return;

    try {
        logger.info(`📧 [SMTP-DEBUG] Step 1: Getting Transporter in sendPasswordResetEmail...`);
        const mailTransporter = await getTransporter();

        // Ensure fromEmail is a valid email format
        let fromEmail = env.SMTP_USER || 'no-reply@locattus.com.br';
        if (fromEmail === 'apikey' || !fromEmail.includes('@')) {
            fromEmail = 'notificacoes@locattus.com.br';
        }

        const fromName = "Locattus";

        logger.info(`📧 [SMTP-DEBUG] Step 2: Sending mail to ${email}...`);
        const info = await mailTransporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject,
            html,
        });

        logger.info(`✅ Reset email delivered to ${email}. MessageId: ${info.messageId}`);

        if (!env.SMTP_USER) {
            logger.info(`📧 Ethereal URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error('Error sending password reset email via SMTP:', error);
    }
}
