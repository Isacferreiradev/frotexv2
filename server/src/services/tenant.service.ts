import { eq } from 'drizzle-orm';
import { db } from '../db';
import { tenants, users } from '../db/schema';
import { AppError } from '../middleware/error.middleware';

export async function getTenantInfo(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
    });
    if (!tenant) throw new AppError(404, 'Empresa não encontrada');
    return tenant;
}

export async function listTeam(tenantId: string) {
    return await db.query.users.findMany({
        where: eq(users.tenantId, tenantId),
        columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
        }
    });
}
export async function updateGatewaySettings(tenantId: string, data: any) {
    const [updated] = await db.update(tenants)
        .set({
            paymentProvider: data.paymentProvider,
            asaasApiKey: data.asaasApiKey,
            asaasWalletId: data.asaasWalletId,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();
    return updated;
}

export async function updateTenantInfo(tenantId: string, data: any) {
    const [updated] = await db.update(tenants)
        .set({
            name: data.name,
            publicName: data.publicName,
            cnpj: data.cnpj,
            contactEmail: data.contactEmail,
            phoneNumber: data.phoneNumber,
            address: data.address,
            logoUrl: data.logoUrl,
            openingHours: data.openingHours,
            nonWorkingDays: data.nonWorkingDays,
            themeConfig: data.themeConfig,
            catalogSettings: data.catalogSettings,
            clientPortalSettings: data.clientPortalSettings,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();
    return updated;
}

export async function updateBusinessSettings(tenantId: string, settings: any) {
    const [updated] = await db.update(tenants)
        .set({
            settings: settings,
            updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();
    return updated;
}
