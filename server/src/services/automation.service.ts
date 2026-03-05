import { eq, and, lt, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { rentals, storeAutomationSettings, clientCommunications, tenants, payments } from '../db/schema';
import { sendWhatsAppMessage } from './whatsapp.service';
import { AsaasService } from './asaas.service';
import logger from '../utils/logger';

export async function checkOverdueRentals() {
    logger.info('[Automation] Starting overdue rentals check...');

    // 1. Get all stores with whatsappEnabled = true OR billing automation
    const automationConfigs = await db.query.storeAutomationSettings.findMany({
        where: or(eq(storeAutomationSettings.whatsappEnabled, true), eq(storeAutomationSettings.notifyOnDueDate, true)),
    });

    for (const config of automationConfigs) {
        // 2. Find overdue rentals for this store
        // returned_at IS NULL, due_date < hoje, status = 'active'
        const now = new Date();
        const overdueRentals = await db.query.rentals.findMany({
            where: and(
                eq(rentals.tenantId, config.tenantId),
                eq(rentals.status, 'active'),
                isNull(rentals.endDateActual),
                lt(rentals.endDateExpected, now)
            ),
            with: {
                customer: true,
                tool: { columns: { name: true } }
            }
        });

        for (const rental of overdueRentals) {
            // Calculate delay in days
            const diffTime = now.getTime() - rental.endDateExpected.getTime();
            const daysOverdue = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            if (daysOverdue >= config.daysAfterDue) {
                // Anti-spam: check if already notified today
                const todayStr = now.toISOString().split('T')[0];
                const lastNotifStr = rental.lastNotificationDate
                    ? rental.lastNotificationDate.toISOString().split('T')[0]
                    : null;

                if (todayStr === lastNotifStr) {
                    logger.debug(`[Automation] Skipping rental ${rental.rentalCode}: already notified today`);
                    continue;
                }

                // Calculate fine
                const finePerDay = parseFloat(config.finePerDay.toString());
                const totalFine = daysOverdue * finePerDay;
                const totalFineFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFine);

                // Generate Payment Link if Asaas is configured
                let paymentLink = '';
                const [tenant] = await db.select({ asaasApiKey: tenants.asaasApiKey }).from(tenants).where(eq(tenants.id, config.tenantId));

                if (tenant?.asaasApiKey) {
                    try {
                        const asaas = new AsaasService(tenant.asaasApiKey);
                        const asaasCustomerId = await asaas.findOrCreateCustomer({
                            name: rental.customer.fullName,
                            document: rental.customer.documentNumber,
                            email: rental.customer.email || undefined,
                            phone: rental.customer.phoneNumber
                        });

                        const billing = await asaas.createPayment({
                            customer: asaasCustomerId,
                            billingType: 'PIX',
                            value: totalFine + parseFloat(rental.totalAmountExpected || '0'),
                            dueDate: now.toISOString().split('T')[0],
                            description: `Cobrança de Atraso - Locação ${rental.rentalCode}`,
                            externalReference: rental.id
                        });
                        paymentLink = billing.paymentLink;
                    } catch (e) {
                        logger.error(`[Automation] Failed to generate Asaas billing for ${rental.rentalCode}`, e);
                    }
                }

                // Format message
                const dueDateFormatted = rental.endDateExpected.toLocaleDateString('pt-BR');
                const totalAmountFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(rental.totalAmountExpected || '0'));

                let message = config.messageTemplate
                    .replace('{{nome}}', rental.customer.fullName)
                    .replace('{{ferramenta}}', rental.tool.name)
                    .replace('{{dias}}', daysOverdue.toString())
                    .replace('{{multa}}', totalFineFormatted)
                    .replace('{{data_vencimento}}', dueDateFormatted)
                    .replace('{{valor_total}}', totalAmountFormatted);

                if (paymentLink) {
                    message += `\n\nLink para pagamento: ${paymentLink}`;
                }

                // Send WhatsApp
                try {
                    if (config.whatsappEnabled) {
                        await sendWhatsAppMessage(rental.customer.phoneNumber, message);
                    }

                    // Update lastNotificationDate to avoid duplication
                    await db.update(rentals)
                        .set({ lastNotificationDate: now })
                        .where(eq(rentals.id, rental.id));

                    // Log communication in CRM
                    await db.insert(clientCommunications).values({
                        tenantId: config.tenantId,
                        customerId: rental.customerId,
                        type: 'whatsapp',
                        message: `[AUTOMÁTICO] ${message}`,
                    });

                    logger.info(`[Automation] Processed notification for customer ${rental.customer.fullName} - Rental ${rental.rentalCode}`);
                } catch (error) {
                    logger.error(`[Automation] Error processing customer ${rental.customer.fullName}:`, error);
                }
            }
        }
    }
}

export async function getAutomationSettings(tenantId: string) {
    let settings = await db.query.storeAutomationSettings.findFirst({
        where: eq(storeAutomationSettings.tenantId, tenantId),
    });

    if (!settings) {
        // Create default settings if not exists
        const result = await db.insert(storeAutomationSettings).values({
            tenantId,
        }).returning();
        settings = result[0];
    }

    return settings;
}

export async function updateAutomationSettings(tenantId: string, data: Partial<import('../db/schema').NewStoreAutomationSettings>) {
    const updated = await db.update(storeAutomationSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(storeAutomationSettings.tenantId, tenantId))
        .returning();

    return updated[0];
}
