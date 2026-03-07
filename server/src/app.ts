import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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
import stripeRoutes from './routes/stripe.routes';
import automationRoutes from './routes/automation.routes';
import onboardingRoutes from './routes/onboarding.routes';


import { globalLimiter } from './middleware/rate-limit.middleware';
import hpp from 'hpp';

const app = express();

// Global Rate limiting
app.use(globalLimiter);

// Security
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

// Parse comma-separated origins robustly
const rawOrigins = env.CORS_ORIGIN.split(',');
const allowedOrigins = rawOrigins.map(o => {
    // Remove whitespace, surrounding quotes, and trailing slashes
    return o.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '');
});

// Log the parsed origins on startup
logger.info(`🔒 CORS Allowed Origins configured: ${allowedOrigins.join(', ')}`);

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps, curl) or if origin is in the allowed list
        if (!origin) return callback(null, true);

        // Normalize incoming origin by removing trailing slash just in case
        const normalizedOrigin = origin.replace(/\/$/, '');

        if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            logger.warn(`🚫 CORS Request Blocked from origin: ${origin}`);
            callback(new Error(`CORS policy restricts access from origin: ${origin}`));
        }
    },
    credentials: true,
}));

// Stripe Webhooks & Routes (Handles raw body internally)
app.use('/api/subscriptions', stripeRoutes);

// General Parsing
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

// Health check (Must be before general routes)
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        logger.error('❌ Healthcheck failed - Database connectivity issue:', {
            message: err.message,
            code: err.code,
            database_url: env.DATABASE_URL.split('@')[1] || 'URL HIDDEN',
            stack: err.stack
        });
        // We return 200 with 'degraded' status to let the deployment finish and show logs in Railway
        res.status(200).json({
            status: 'degraded',
            database: 'disconnected',
            message: 'Database unavailable',
            error: env.NODE_ENV === 'development' ? err.message : 'Check server logs'
        });
    }
});

// Webhooks (Public)
app.post('/api/webhooks/asaas', express.json(), webhooksCtrl.asaasWebhook);

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes - all require authentication + tenant context
app.use('/api', authenticate, tenantContext);
app.use('/api/tools', toolsRoutes);
app.use('/api/tool-categories', categoriesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/rentals', rentalsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contract-templates', templatesRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/onboarding', onboardingRoutes);


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
