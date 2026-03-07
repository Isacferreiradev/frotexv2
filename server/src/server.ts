import app from './app';
import { env } from './config/env';
import { pool } from './db';
import logger from './utils/logger';
import { runMigration } from './db/migrate';
import { initCronJobs } from './utils/cron';

async function startServer() {
    logger.info(`📁 Working Directory: ${process.cwd()}`);
    // Start listening immediately to pass Railway healthchecks
    const listenPort = env.INTERNAL_BACKEND_PORT || env.PORT;
    logger.info(`📡 Attempting to bind to PORT: ${listenPort} (System PORT: ${process.env.PORT}, Internal: ${env.INTERNAL_BACKEND_PORT})`);

    const server = app.listen(listenPort, '0.0.0.0', () => {
        logger.info(`🚀 AlugaFácil Pro API running on port ${listenPort}`);
        logger.info(`🌐 Binding: 0.0.0.0:${listenPort}`);
        logger.info(`📊 Environment: ${env.NODE_ENV}`);
    }).on('error', (err: any) => {
        logger.error('❌ FATAL: Server failed to start:', err);
        process.exit(1);
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
