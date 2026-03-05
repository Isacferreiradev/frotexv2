import logger from '../utils/logger';

export class EvolutionService {
    private apiUrl: string;
    private apiKey: string;

    constructor() {
        this.apiUrl = process.env.WHATSAPP_API_URL || '';
        this.apiKey = process.env.WHATSAPP_API_KEY || '';
    }

    private get headers() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
        };
    }

    /**
     * Obtains a QR code or status for a given instance.
     * Creates the instance if it does not exist.
     */
    async connectInstance(instanceName: string) {
        try {
            // First we try to create an instance, or fetch it if it exists
            const createRes = await fetch(`${this.apiUrl}/instance/create`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    instanceName: instanceName,
                    token: instanceName, // Simplification: using the same name for token
                    qrcode: true
                })
            });

            // The instance might already exist (403 or similar config error).
            // Usually, Evolution API /instance/create handles idempotency if we fetch status instead,
            // but let's blindly try to connect it to get the base64 QR Code.

            const connectRes = await fetch(`${this.apiUrl}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!connectRes.ok) throw new Error(`Failed to connect instance: ${await connectRes.text()}`);

            return await connectRes.json();
        } catch (error) {
            logger.error(`[Evolution API] Error connecting instance ${instanceName}:`, error);
            throw error;
        }
    }

    /**
     * Checks the connection state (open, connecting, close).
     */
    async getConnectionState(instanceName: string) {
        try {
            const res = await fetch(`${this.apiUrl}/instance/connectionState/${instanceName}`, {
                method: 'GET',
                headers: this.headers
            });
            if (!res.ok) throw new Error(`Failed to get connection state: ${await res.text()}`);
            return await res.json();
        } catch (error) {
            logger.error(`[Evolution API] Error checking state for ${instanceName}:`, error);
            throw error;
        }
    }

    /**
     * Logs out the WhatsApp session.
     */
    async logoutInstance(instanceName: string) {
        try {
            const res = await fetch(`${this.apiUrl}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: this.headers
            });
            return res.ok;
        } catch (error) {
            logger.error(`[Evolution API] Error logging out ${instanceName}:`, error);
            throw error;
        }
    }
}
