import logger from './logger';

interface RetryOptions {
    retries: number;
    delay: number;
    factor: number;
}

const defaultOptions: RetryOptions = {
    retries: 5,
    delay: 2000, // 2 seconds
    factor: 2,   // Exponential backoff
};

/**
 * Executes a function with retry logic.
 * Useful for handling transient errors like DNS (EAI_AGAIN) or DB connection timeouts.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const opts = { ...defaultOptions, ...options };
    let lastError: any;
    let currentDelay = opts.delay;

    for (let i = 0; i < opts.retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Log only relevant network/connection errors
            const isTransient =
                error.code === 'EAI_AGAIN' ||
                error.code === 'ECONNREFUSED' ||
                error.message.includes('timeout') ||
                error.message.includes('connection');

            if (isTransient) {
                logger.warn(`[RETRY] Attempt ${i + 1}/${opts.retries} failed. Retrying in ${currentDelay}ms... (Error: ${error.code || error.message})`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= opts.factor;
            } else {
                // If it's a structural error (Query failed, etc), throw immediately
                throw error;
            }
        }
    }

    throw lastError;
}
