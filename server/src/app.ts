import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import logger from './utils/logger';
import { authenticate } from './middleware/auth.middleware';
import { tenantContext } from './middleware/tenant.middleware';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import toolsRoutes from './routes/tools.routes';
import categoriesRoutes from './routes/categories.routes';
import customersRoutes from './routes/customers.routes';
import rentalsRoutes from './routes/rentals.routes';
import paymentsRoutes from './routes/payments.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import searchRoutes from './routes/search.routes';
import tenantRoutes from './routes/tenant.routes';
import activityRoutes from './routes/activity.routes';
import * as webhooksCtrl from './controllers/webhooks.controller';
import templatesRoutes from './routes/templates.routes';
import financeRoutes from './routes/finance.routes';
import communicationsRoutes from './routes/communications.routes';
import quotesRoutes from './routes/quotes.routes';
import intelligenceRoutes from './routes/intelligence.routes';
// import stripeRoutes from './routes/stripe.routes'; // REMOVED: Migrating to AbacatePay
import automationRoutes from './routes/automation.routes';
import onboardingRoutes from './routes/onboarding.routes';
import exportRoutes from './routes/export.routes';
import adminRoutes from './routes/admin.routes';
import billingRoutes from './routes/billing.routes';
import webhookRoutes from './routes/webhook.routes';


import { globalLimiter } from './middleware/rate-limit.middleware';
import hpp from 'hpp';

const app = express();

// ─── CORS & Preflight — MUST come BEFORE rate limiters and other middleware ──
// If rate-limiter runs first it may respond to OPTIONS without CORS headers,
// causing the browser to see "No Access-Control-Allow-Origin".

// Parse comma-separated origins robustly
const rawOrigins = env.CORS_ORIGIN.split(',');
const allowedOrigins = rawOrigins.map(o =>
    o.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '')
);

logger.info(`🔒 CORS Allowed Origins configured: ${allowedOrigins.join(', ')}`);

const corsOptions: cors.CorsOptions = {
    // Allow ALL origins — real security is enforced by JWT authentication.
    // We log unlisted origins for monitoring but never block them.
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // server-to-server / curl
        if (allowedOrigins.includes('*')) return callback(null, true);

        const getCleanHost = (urlStr: string) => {
            try {
                const validUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
                return new URL(validUrl).hostname.replace(/^www\./, '').toLowerCase();
            } catch {
                return urlStr.toLowerCase().trim().replace(/^www\./, '');
            }
        };
        const originHost = getCleanHost(origin);
        const isAllowed = allowedOrigins.some(a => getCleanHost(a) === originHost);
        if (!isAllowed) {
            logger.error(`⚠️ CORS BLOCK: unlisted origin tried to access API: ${origin}`);
            return callback(new Error('CORS Blocking: Origin not allowed'), false);
        }
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Api-Key'],
    optionsSuccessStatus: 204,
};

// Answer ALL preflight OPTIONS requests immediately, before any other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Global Rate limiting (after CORS so preflight is never rate-limited)
app.use(globalLimiter);

// Security headers (after CORS so helmet doesn't interfere with preflight)
app.set('trust proxy', 1);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://api.qrserver.com"],
            connectSrc: ["'self'", "https://api.resend.com", "https://api.stripe.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));
app.use(hpp());

// Stripe Webhooks & Routes (DEPRECATED - Use /api/billing)
app.use(['/api/subscriptions', '/api/stripe'], (req, res) => {
    res.status(410).json({
        status: 'error',
        message: 'O sistema de pagamentos via Stripe foi desativado. Por favor, utilize a nova aba de Assinatura nas configurações.',
        redirect: '/configuracoes?tab=assinatura'
    });
});

// General Parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

import { pool } from './db';

// Root / Basic info
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'FROTEX API is running',
        environment: env.NODE_ENV,
        health: '/health'
    });
});

// Health check
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        logger.error('❌ Healthcheck failed:', err.message);
        res.status(200).json({
            status: 'degraded',
            database: 'disconnected',
            message: 'Database unavailable'
        });
    }
});

// Webhooks (Public)
app.use('/api/webhooks', webhookRoutes);
app.post('/api/webhooks/asaas', express.json(), webhooksCtrl.asaasWebhook);

// 1. Administrative API (Master Access via API Key)
// Important: Mount BEFORE any other /api routes that might have global middleware
app.use('/api/admin', adminRoutes);

// 2. Public Auth API
app.use('/api/auth', authRoutes);

// 3. Protected SaaS API (User Token + Tenant Context)
// We apply authenticate and tenantContext ONLY to these routes
app.use('/api/tools', authenticate, tenantContext, toolsRoutes);
app.use('/api/tool-categories', authenticate, tenantContext, categoriesRoutes);
app.use('/api/customers', authenticate, tenantContext, customersRoutes);
app.use('/api/rentals', authenticate, tenantContext, rentalsRoutes);
app.use('/api/payments', authenticate, tenantContext, paymentsRoutes);
app.use('/api/maintenance', authenticate, tenantContext, maintenanceRoutes);
app.use('/api/search', authenticate, tenantContext, searchRoutes);
app.use('/api/tenant', authenticate, tenantContext, tenantRoutes);
app.use('/api/activity', authenticate, tenantContext, activityRoutes);
app.use('/api/contract-templates', authenticate, tenantContext, templatesRoutes);
app.use('/api/finance', authenticate, tenantContext, financeRoutes);
app.use('/api/communications', authenticate, tenantContext, communicationsRoutes);
app.use('/api/quotes', authenticate, tenantContext, quotesRoutes);
app.use('/api/intelligence', authenticate, tenantContext, intelligenceRoutes);
app.use('/api/automation', authenticate, tenantContext, automationRoutes);
app.use('/api/onboarding', authenticate, tenantContext, onboardingRoutes);
app.use('/api/export', authenticate, tenantContext, exportRoutes);
app.use('/api/billing', billingRoutes);


// Fallback for non-existent API routes
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
        suggestion: 'Check /api prefix or /health'
    });
});

app.use(errorHandler);

export default app;
