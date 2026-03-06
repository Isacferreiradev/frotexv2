import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    SMTP_HOST: z.string().default('smtp.hostinger.com'),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: z.coerce.boolean().default(false),
    SMTP_USER: z.string().email().optional(),
    SMTP_PASS: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).default(process.env.NODE_ENV === 'production' ? undefined : 'sk_test_placeholder' as any),
    STRIPE_PRICE_PRO_ID: z.string().min(1).default(process.env.NODE_ENV === 'production' ? undefined : 'price_placeholder' as any),
    STRIPE_PRICE_SCALE_ID: z.string().min(1).default(process.env.NODE_ENV === 'production' ? undefined : 'price_placeholder' as any),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).default(process.env.NODE_ENV === 'production' ? undefined : 'whsec_placeholder' as any),
    RESEND_API_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;

// Debug DB Host (Safe)
if (env.DATABASE_URL) {
    try {
        const dbUrl = new URL(env.DATABASE_URL);
        console.log(`🔌 DB Host: ${dbUrl.hostname}:${dbUrl.port || '5432'}`);
    } catch (e) {
        console.log('🔌 DB Host: [Invalid URL Format]');
    }
}
