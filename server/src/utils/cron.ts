import cron from 'node-cron';
import { checkOverdueRentals } from '../services/automation.service';
import logger from './logger';

export function initCronJobs() {
    logger.info('[Cron] Initializing cron jobs...');

    // Run every day at 09:00 AM
    cron.schedule('0 9 * * *', async () => {
        try {
            logger.info('[Cron] Triggering daily overdue rentals check...');
            await checkOverdueRentals();
        } catch (error) {
            logger.error('[Cron] Error in daily overdue rentals check:', error);
        }
    }, {
        timezone: 'America/Sao_Paulo'
    });

    logger.info('[Cron] Daily overdue check scheduled for 09:00 AM');
}
