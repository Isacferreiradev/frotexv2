import { Request, Response, NextFunction } from 'express';
import * as exportService from '../services/export.service';
import ReactPDF from '@react-pdf/renderer';
import React from 'react';
import { TabularReport } from '../services/reports.template';
import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';

export async function generateExport(req: Request, res: Response, next: NextFunction) {
    try {
        const tenantId = req.user!.tenantId;
        const { module, format, startDate, endDate, categoryId, status } = req.body;

        if (!module || !format) {
            throw new AppError(400, 'Módulo e formato são obrigatórios');
        }

        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
        if (!tenant) throw new AppError(404, 'Tenant não encontrado');

        let data: any[] = [];
        let title = "";
        let columns: any[] = [];

        const filters = { startDate, endDate, categoryId, status };

        switch (module) {
            case 'tools':
                data = await exportService.getToolsData(tenantId, filters);
                title = "Relatório de Equipamentos (Ativos)";
                columns = [
                    { header: "Nome", key: "Nome", width: 120 },
                    { header: "Marca", key: "Marca" },
                    { header: "Modelo", key: "Modelo" },
                    { header: "Patrimônio", key: "Patrimônio" },
                    { header: "Categoria", key: "Categoria" },
                    { header: "Diária", key: "Valor Diária", width: 70 },
                    { header: "Status", key: "Status", width: 60 }
                ];
                break;
            case 'customers':
                data = await exportService.getCustomersData(tenantId);
                title = "Relatório de Clientes";
                columns = [
                    { header: "Nome", key: "Nome", width: 150 },
                    { header: "Documento", key: "Documento", width: 100 },
                    { header: "Email", key: "Email", width: 130 },
                    { header: "Telefone", key: "Telefone" },
                    { header: "Cidade/UF", key: "Cidade/UF" },
                    { header: "Status", key: "Status", width: 60 }
                ];
                break;
            case 'rentals':
                data = await exportService.getRentalsData(tenantId, filters);
                title = "Relatório de Locações";
                columns = [
                    { header: "Código", key: "Código", width: 70 },
                    { header: "Cliente", key: "Cliente", width: 140 },
                    { header: "Equipamento", key: "Equipamento", width: 140 },
                    { header: "Início", key: "Início" },
                    { header: "Fim Prev.", key: "Fim Previsto" },
                    { header: "Total Est.", key: "Total Estimado", width: 80 },
                    { header: "Status", key: "Status", width: 70 }
                ];
                break;
            case 'finance':
                data = await exportService.getFinanceData(tenantId, filters);
                title = "Extrato Financeiro Consolidado";
                columns = [
                    { header: "Data", key: "Data", width: 70 },
                    { header: "Tipo", key: "Tipo", width: 90 },
                    { header: "Categoria", key: "Categoria", width: 90 },
                    { header: "Descrição", key: "Descrição", width: 180 },
                    { header: "Valor", key: "Valor", width: 80 },
                    { header: "Status", key: "Status", width: 70 }
                ];
                // Formatar valores para PDF do financeiro (os dados da service vêm como números crus no valor para ordenar)
                data = data.map(item => ({
                    ...item,
                    Valor: item.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }));
                break;
            default:
                throw new AppError(400, 'Módulo inválido');
        }

        const periodStr = startDate && endDate
            ? `${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`
            : "Todo o período";

        if (format === 'csv') {
            const csv = exportService.jsonToCsv(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=export-${module}-${Date.now()}.csv`);
            return res.send(csv);
        } else if (format === 'pdf') {
            const stream = await ReactPDF.renderToStream(
                (
                    <TabularReport
                        title={title}
                        tenantName={tenant.name}
                        period={periodStr}
                        data={data}
                        columns={columns}
                    />
                )
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=export-${module}-${Date.now()}.pdf`);
            return stream.pipe(res);
        } else {
            throw new AppError(400, 'Formato inválido');
        }
    } catch (err) {
        next(err);
    }
}
