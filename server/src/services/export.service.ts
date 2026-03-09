import { db } from '../db';
import { tools, customers, rentals, payments, expenses, otherRevenues, toolCategories } from '../db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import logger from '../utils/logger';

export interface ExportFilters {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    status?: string;
}

export async function getToolsData(tenantId: string, filters: ExportFilters) {
    const whereConditions = [eq(tools.tenantId, tenantId)];
    if (filters.categoryId) whereConditions.push(eq(tools.categoryId, filters.categoryId));
    if (filters.status) whereConditions.push(eq(tools.status, filters.status as any));

    const data = await db.query.tools.findMany({
        where: and(...whereConditions),
        with: { category: true },
        orderBy: [desc(tools.createdAt)]
    });

    return data.map(t => ({
        id: t.id,
        "Nome": t.name,
        "Marca": t.brand || '-',
        "Modelo": t.model || '-',
        "Série": t.serialNumber || '-',
        "Patrimônio": t.assetTag || '-',
        "Categoria": t.category?.name || '-',
        "Valor Diária": parseFloat(t.dailyRate).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        "Status": t.status,
        "Última Manut.": t.lastMaintenanceAt ? new Date(t.lastMaintenanceAt).toLocaleDateString('pt-BR') : '-'
    }));
}

export async function getCustomersData(tenantId: string) {
    try {
        const data = await db.query.customers.findMany({
            where: eq(customers.tenantId, tenantId),
            orderBy: [desc(customers.createdAt)]
        });

        return data.map(c => ({
            "Nome": c.fullName,
            "Documento": `${c.documentType}: ${c.documentNumber}`,
            "Email": c.email || '-',
            "Telefone": c.phoneNumber,
            "Cidade/UF": `${c.addressCity || '-'}/${c.addressState || '-'}`,
            "Classificação": (c as any).classification || 'new',
            "Status": c.isBlocked ? 'Bloqueado' : 'Ativo',
            "Criado em": new Date(c.createdAt).toLocaleDateString('pt-BR')
        }));
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[EXPORT] getCustomersData fallback`);
            const basicData = await db
                .select({
                    fullName: customers.fullName,
                    documentType: customers.documentType,
                    documentNumber: customers.documentNumber,
                    email: customers.email,
                    phoneNumber: customers.phoneNumber,
                    isBlocked: customers.isBlocked,
                    createdAt: customers.createdAt
                })
                .from(customers)
                .where(eq(customers.tenantId, tenantId))
                .orderBy(desc(customers.createdAt));

            return basicData.map(c => ({
                "Nome": c.fullName,
                "Documento": `${c.documentType}: ${c.documentNumber}`,
                "Email": c.email || '-',
                "Telefone": c.phoneNumber,
                "Cidade/UF": 'N/A',
                "Classificação": 'new',
                "Status": c.isBlocked ? 'Bloqueado' : 'Ativo',
                "Criado em": new Date(c.createdAt).toLocaleDateString('pt-BR')
            }));
        }
        throw err;
    }
}

export async function getRentalsData(tenantId: string, filters: ExportFilters) {
    const whereConditions = [eq(rentals.tenantId, tenantId)];
    if (filters.startDate) whereConditions.push(gte(rentals.startDate, new Date(filters.startDate)));
    if (filters.endDate) whereConditions.push(lte(rentals.startDate, new Date(filters.endDate)));
    if (filters.status) whereConditions.push(eq(rentals.status, filters.status as any));

    try {
        const data = await db.query.rentals.findMany({
            where: and(...whereConditions),
            with: { tool: true, customer: true },
            orderBy: [desc(rentals.startDate)]
        });

        return data.map(r => ({
            "Código": r.rentalCode,
            "Cliente": r.customer?.fullName || 'Excluído',
            "Equipamento": r.tool?.name || 'Excluído',
            "Início": new Date(r.startDate).toLocaleDateString('pt-BR'),
            "Fim Previsto": new Date(r.endDateExpected).toLocaleDateString('pt-BR'),
            "Valor Acordado": parseFloat(r.dailyRateAgreed).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            "Total Estimado": parseFloat(r.totalAmountExpected).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            "Status": r.status
        }));
    } catch (err: any) {
        if (err.code === '42703') {
            logger.warn(`[EXPORT] getRentalsData fallback`);
            const basicData = await db
                .select({
                    rentalCode: rentals.rentalCode,
                    startDate: rentals.startDate,
                    endDateExpected: rentals.endDateExpected,
                    dailyRateAgreed: rentals.dailyRateAgreed,
                    totalAmountExpected: rentals.totalAmountExpected,
                    status: rentals.status
                })
                .from(rentals)
                .where(and(...whereConditions))
                .orderBy(desc(rentals.startDate));

            return basicData.map(r => ({
                "Código": r.rentalCode,
                "Cliente": 'N/A',
                "Equipamento": 'N/A',
                "Início": new Date(r.startDate).toLocaleDateString('pt-BR'),
                "Fim Previsto": new Date(r.endDateExpected).toLocaleDateString('pt-BR'),
                "Valor Acordado": parseFloat(r.dailyRateAgreed).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                "Total Estimado": parseFloat(r.totalAmountExpected).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                "Status": r.status
            }));
        }
        throw err;
    }
}

export async function getFinanceData(tenantId: string, filters: ExportFilters) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 86400000);
    const end = filters.endDate ? new Date(filters.endDate) : new Date();

    const payData = await db.query.payments.findMany({
        where: and(eq(payments.tenantId, tenantId), gte(payments.paymentDate, start), lte(payments.paymentDate, end)),
        with: { rental: true }
    });

    const expData = await db.query.expenses.findMany({
        where: and(eq(expenses.tenantId, tenantId), gte(expenses.date, start), lte(expenses.date, end))
    });

    const revData = await db.query.otherRevenues.findMany({
        where: and(eq(otherRevenues.tenantId, tenantId), gte(otherRevenues.date, start), lte(otherRevenues.date, end))
    });

    const unified = [
        ...payData.map(p => ({
            "Data": new Date(p.paymentDate).toLocaleDateString('pt-BR'),
            "Tipo": 'Receita (Locação)',
            "Categoria": 'Locação',
            "Descrição": `Pagamento ref. ${p.rental?.rentalCode || 'Locação'}`,
            "Valor": parseFloat(p.amount) || 0,
            "Desconto": 0,
            "Status": p.status
        })),
        ...revData.map(r => ({
            "Data": new Date(r.date).toLocaleDateString('pt-BR'),
            "Tipo": 'Outra Receita',
            "Categoria": r.category,
            "Descrição": r.description,
            "Valor": parseFloat(r.amount) || 0,
            "Desconto": 0,
            "Status": 'Concluído'
        })),
        ...expData.map(e => ({
            "Data": new Date(e.date).toLocaleDateString('pt-BR'),
            "Tipo": 'Despesa',
            "Categoria": e.category,
            "Descrição": e.description,
            "Valor": -parseFloat(e.amount) || 0,
            "Desconto": 0,
            "Status": 'Concluído'
        }))
    ];

    return unified.sort((a, b) => {
        const dateA = new Date(a.Data.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.Data.split('/').reverse().join('-')).getTime();
        return dateB - dateA;
    });
}

export function jsonToCsv(data: any[]) {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    return [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => `"${('' + row[fieldName]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
}
