import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/error.middleware';

export interface AbacatePayCheckoutPayload {
    amount: number; // In cents
    description?: string;
    externalId?: string;
    customerId?: string;
    customer?: {
        name: string;
        email: string;
        taxId: string; // CPF or CNPJ
        cellphone?: string;
    };
}

export interface AbacatePayCheckoutResponse {
    id: string;
    amount: number;
    status: string;
    devMode: boolean;
    method: string;
    brCode: string;
    brCodeBase64: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * AbacatePay Integration Client
 * Based on Version 2 of the API
 */
export class AbacatePayClient {
    private static readonly BASE_URL = 'https://api.abacatepay.com/v1';

    private static getHeaders() {
        const apiKey = env.ABACATE_PAY_API_KEY;

        if (!apiKey) {
            logger.error('[ABACATEPAY] ABACATE_PAY_API_KEY is undefined in env object');
            throw new AppError(500, 'ABACATE_PAY_API_KEY is not configured');
        }

        // Log partial key for verification in dev
        logger.info(`[ABACATEPAY] Using API Key: ${apiKey.substring(0, 8)}...`);

        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Create a transparent checkout for PIX (V1)
     */
    static async createTransparentCheckout(payload: AbacatePayCheckoutPayload): Promise<AbacatePayCheckoutResponse> {
        try {
            logger.info(`[ABACATEPAY] Creating V1 PIX Checkout for amount: ${payload.amount} cents`);

            // V1 uses flat payload (no 'data' wrapper and no 'method' field)
            const response = await axios.post(`${this.BASE_URL}/pixQrCode/create`, payload, {
                headers: this.getHeaders()
            });

            if (!response.data || !response.data.data) {
                logger.error(`[ABACATEPAY] Invalid V1 response format: ${JSON.stringify(response.data)}`);
                throw new Error('Invalid response structure from AbacatePay V1');
            }

            return response.data.data;
        } catch (error: any) {
            const apiError = error.response?.data?.error || error.message;
            logger.error(`[ABACATEPAY] Create checkout failed: ${apiError}`);
            throw new AppError(500, `AbacatePay Error: ${apiError}`);
        }
    }

    /**
     * Check status of a PIX charge (V1)
     */
    static async checkChargeStatus(abacatePayId: string): Promise<string> {
        try {
            const response = await axios.get(`${this.BASE_URL}/pixQrCode/check`, {
                params: { id: abacatePayId },
                headers: this.getHeaders()
            });

            // V1 check endpoint returns { data: { status: '...' } }
            return response.data?.data?.status;
        } catch (error: any) {
            logger.error(`[ABACATEPAY] Check status failed for ${abacatePayId}: ${error.message}`);
            return 'pending'; // Fallback to pending if check fails
        }
    }

    /**
     * Validate Webhook Signature using HMAC-SHA256
     */
    static validateSignature(payload: string, signature: string): boolean {
        const secret = env.ABACATE_PAY_WEBHOOK_SECRET;
        if (!secret) {
            logger.error('[ABACATEPAY] ABACATE_PAY_WEBHOOK_SECRET not configured');
            return false;
        }

        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update(payload).digest('hex');

        return digest === signature;
    }
}
