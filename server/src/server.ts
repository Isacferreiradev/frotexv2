import app from './app';
import { env } from './config/env';
import { pool } from './db';
import logger from './utils/logger';
import { runMigration } from './db/migrate';
import { initCronJobs } from './utils/cron';

async function startServer() {
    logger.info(`📁 Working Directory: ${process.cwd()}`);
    // Start listening immediately to pass Railway healthchecks
    logger.info(`📡 Attempting to bind to PORT: ${env.PORT} (Raw: ${process.env.PORT})`);
    const server = app.listen(env.PORT, '0.0.0.0', () => {
        logger.info(`🚀 AlugaFácil Pro API running on port ${env.PORT}`);
        logger.info(`🌐 Binding: 0.0.0.0:${env.PORT}`);
        logger.info(`📊 Environment: ${env.NODE_ENV}`);
    });

    try {
        if (env.NODE_ENV === 'production') {
            logger.info('⏳ Production detected: Running migrations...');
            await runMigration();
        }

        initCronJobs();

        // Check for optional services
        if (!env.STRIPE_SECRET_KEY) logger.warn('⚠️ STRIPE_SECRET_KEY missing. Payment features will be disabled.');
        if (!env.RESEND_API_KEY) logger.warn('⚠️ RESEND_API_KEY missing. Email features will be limited.');

        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received, closing gracefully...');
            server.close(async () => {
                await pool.end();
                logger.info('Server closed');
                process.exit(0);
            });
        });
    } catch (error) {
        logger.error('❌ Error during post-startup initialization:', error);
        // We don't exit here to allow healthcheck debugging, unless it's fatal
    }
}

startServer();

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
});
