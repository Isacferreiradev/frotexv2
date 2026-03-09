import { Request, Response, NextFunction } from 'express';
import * as exportService from '../services/export.service';
import ReactPDF, { Font } from '@react-pdf/renderer';
import React from 'react';
import { TabularReport } from '../services/reports.template';
import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

// Registrar fontes padrão para evitar erros no servidor
try {
    Font.register({
        family: 'Helvetica',
        fonts: [
            { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
            { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
        ]
    });
} catch (e) {
    logger.warn('Failed to register external fonts for PDF, using defaults', e);
}

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

        try {
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
                        { header: "Desconto", key: "Desconto", width: 80 },
                        { header: "Status", key: "Status", width: 70 }
                    ];
                    // Formatar valores para PDF do financeiro (os dados da service vêm como números crus no valor para ordenar)
                    logger.debug(`[EXPORT] Formatting ${data.length} finance items`);
                    data = data.map(item => ({
                        ...item,
                        Valor: (item.Valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                        Desconto: (item.Desconto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }));
                    break;
                default:
                    throw new AppError(400, 'Módulo inválido');
            }
        } catch (fetchError: any) {
            logger.error(`[EXPORT] Data fetching failed for module ${module} (tenant ${tenantId}):`, fetchError);
            throw new AppError(500, `Erro ao buscar dados para exportação do módulo ${module}. Isso pode ocorrer por colunas faltando no banco de dados. Detalhe: ${fetchError.message}`);
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
            try {
                logger.info(`Starting PDF generation for module: ${module}, tenant: ${tenantId}`);
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

                stream.on('error', (err) => {
                    logger.error('Stream error during PDF generation:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, message: 'Erro no processamento do arquivo' });
                    }
                });

                return stream.pipe(res);
            } catch (pdfErr) {
                logger.error('Critical error rendering PDF to stream:', pdfErr);
                throw new AppError(500, 'Falha catastrófica ao gerar PDF. Verifique os logs do servidor.');
            }
        } else {
            throw new AppError(400, 'Formato inválido');
        }
    } catch (err) {
        next(err);
    }
}
