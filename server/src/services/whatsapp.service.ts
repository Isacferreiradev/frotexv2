import logger from '../utils/logger';

export async function sendWhatsAppMessage(phone: string, message: string, instanceName?: string) {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    // Fallback to ENV instance if not provided explicitly
    const activeInstanceName = instanceName || process.env.WHATSAPP_INSTANCE_NAME;

    // Remove non-numeric characters from the phone number
    const cleanPhone = phone.replace(/\D/g, '');

    if (!apiUrl || !apiKey || !activeInstanceName) {
        logger.warn(`[WhatsApp API] Credentials not fully configured. Falling back to MOCK mode.`);
        logger.info(`[MOCK WHATSAPP] To: ${cleanPhone}`);
        logger.info(`[MOCK WHATSAPP] Message: ${message}`);
        return { success: true, messageId: `mock_${Date.now()}` };
    }

    try {
        logger.info(`[WhatsApp API] Sending message to ${cleanPhone}...`);

        // Evolution API v1/v2 payload standard for sending text messages
        const response = await fetch(`${apiUrl}/message/sendText/${activeInstanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                number: `${cleanPhone}`, // Evolution API usually figures out the @s.whatsapp.net
                options: {
                    delay: 1200,
                    presence: 'composing',
                    linkPreview: false
                },
                textMessage: {
                    text: message
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        logger.info(`[WhatsApp API] Message sent successfully to ${cleanPhone}.`);
        return { success: true, data };

    } catch (error) {
        logger.error(`[WhatsApp API] Error sending message to ${cleanPhone}:`, error);
        throw error;
    }
}
