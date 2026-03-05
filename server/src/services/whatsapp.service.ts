
export async function sendWhatsAppMessage(phone: string, message: string) {
    // MOCKED: For now, we just log the message to the console.
    // In a real scenario, this would call a WhatsApp API (e.g., Twilio, Evolution API, etc.)
    console.log('--------------------------------------------------');
    console.log(`[MOCK WHATSAPP] To: ${phone}`);
    console.log(`[MOCK WHATSAPP] Message: ${message}`);
    console.log('--------------------------------------------------');

    // We can also log this as a communication in the future if needed, 
    // but the main goal here is the mock dispatch.
    return { success: true, messageId: `mock_${Date.now()}` };
}
