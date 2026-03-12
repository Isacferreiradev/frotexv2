import axios from 'axios';
import crypto from 'crypto';

// Configuration
const WEBHOOK_URL = 'http://localhost:4000/api/webhooks/abacatepay';
const WEBHOOK_SECRET = 'locattus_secret_dev'; // Must match .env

async function simulateWebhook(abacatePayId: string) {
    const payload = {
        event: 'checkout.completed',
        data: {
            id: abacatePayId,
            status: 'paid'
        }
    };

    const bodyStr = JSON.stringify(payload);

    // Generate signature
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const signature = hmac.update(bodyStr).digest('hex');

    try {
        console.log(`🚀 Simulating success for charge: ${abacatePayId}...`);
        const response = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature
            }
        });

        console.log('✅ Webhook accepted:', response.status, response.data);
    } catch (error: any) {
        console.error('❌ Webhook failed:', error.response?.data || error.message);
    }
}

// Get ID from args
const chargeId = process.argv[2];
if (!chargeId) {
    console.log('Usage: npx tsx scripts/simulate_payment.ts <CHARGE_UUID_OR_ABACATE_ID>');
    console.log('Hint: You can find the UUID in the server logs or the Abacate ID in the metadata.');
    process.exit(1);
}

simulateWebhook(chargeId);
