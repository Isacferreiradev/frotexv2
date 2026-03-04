/* eslint-disable no-console */
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

// Initialize transporter conditionally
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
    if (transporter) return transporter;

    if (env.SMTP_USER && env.SMTP_PASS) {
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
            }
        });

        try {
            await transporter.verify();
            logger.info(`✅ SMTP Connection verified for ${env.SMTP_USER}`);
        } catch (error) {
            logger.error(`❌ SMTP Connection failed for ${env.SMTP_USER}:`, error);
            // Fallback to null to try ethereal or just fail gracefully next time
            transporter = null;
            throw error;
        }
    } else {
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

export async function sendVerificationEmail(email: string, fullName: string, token: string) {
    const verificationUrl = `${env.CORS_ORIGIN}/verify?token=${token}`;

    logger.info(`\n==============================================`);
    logger.info(`📧 VERIFICATION EMAIL FOR: ${email}`);
    logger.info(`🔗 CLICK HERE TO VERIFY: ${verificationUrl}`);
    logger.info(`==============================================\n`);

    try {
        const mailTransporter = await getTransporter();
        const fromEmail = env.SMTP_USER || 'no-reply@frotex.com';
        const fromName = "Frotex";

        const info = await mailTransporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject: 'Confirme seu e-mail - Frotex',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">Bem-vindo ao Frotex, ${fullName}!</h2>
                    <p>Ficamos felizes em ter você conosco. Para começar a gerenciar sua locadora, precisamos apenas que você confirme seu e-mail.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${verificationUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Confirmar E-mail
                        </a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:</p>
                    <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">Você recebeu este e-mail porque se cadastrou no Frotex. Se não foi você, pode ignorar esta mensagem.</p>
                </div>
            `,
        });

        logger.info(`✅ Verification email delivered to ${email}. MessageId: ${info.messageId}`);

        if (!env.SMTP_USER) {
            logger.info(`📧 Ethereal URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error('Error sending verification email:', error);
    }
}

export async function sendPasswordResetEmail(email: string, fullName: string, token: string) {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${token}`;

    logger.info(`\n==============================================`);
    logger.info(`🔑 PASSWORD RESET FOR: ${email}`);
    logger.info(`🔗 CLICK HERE TO RESET: ${resetUrl}`);
    logger.info(`==============================================\n`);

    try {
        const mailTransporter = await getTransporter();
        const fromEmail = env.SMTP_USER || 'no-reply@frotex.com';
        const fromName = "Frotex";

        const info = await mailTransporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject: 'Recupere sua senha - Frotex',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #7c3aed;">Recuperação de Senha</h2>
                    <p>Olá ${fullName}, recebemos uma solicitação para redefinir a sua senha no Frotex.</p>
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
            `,
        });

        logger.info(`✅ Reset email delivered to ${email}. MessageId: ${info.messageId}`);

        if (!env.SMTP_USER) {
            logger.info(`📧 Ethereal URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error('Error sending password reset email:', error);
    }
}
