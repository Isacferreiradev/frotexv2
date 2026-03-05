import app from './app';
import { env } from './config/env';
import { pool } from './db';
import logger from './utils/logger';
import { runMigration } from './db/migrate';
import { initCronJobs } from './utils/cron';

async function startServer() {
    try {
        if (env.NODE_ENV === 'production') {
            await runMigration();
        }

        initCronJobs();

        const server = app.listen(env.PORT, '0.0.0.0', () => {
            logger.info(`🚀 AlugaFácil Pro API running on port ${env.PORT}`);
            logger.info(`🌐 Binding: 0.0.0.0:${env.PORT}`);
            logger.info(`📊 Environment: ${env.NODE_ENV}`);
        });

        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received, closing gracefully...');
            server.close(async () => {
                await pool.end();
                logger.info('Server closed');
                process.exit(0);
            });
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
});
