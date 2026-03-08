'use client';

import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuotePrintViewProps {
    quote: any;
    tenant: any;
}

export function QuotePrintView({ quote, tenant }: QuotePrintViewProps) {
    if (!quote) return null;

    const subtotal = quote.items?.reduce((acc: number, item: any) => acc + (parseFloat(item.totalAmount)), 0) || 0;
    const total = parseFloat(quote.totalAmount);
    const discount = parseFloat(quote.totalDiscount);

    return (
        <div className="bg-white p-12 min-h-[29.7cm] w-[21cm] mx-auto text-zinc-900 font-sans border border-zinc-100" id="quote-print-area">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-zinc-100 pb-8 mb-8">
                <div>
                    {tenant?.logoUrl ? (
                        <img src={tenant.logoUrl} alt={tenant.name} className="h-16 object-contain mb-4" />
                    ) : (
                        <div className="h-16 flex items-center mb-4">
                            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
                                {tenant?.name || 'FROTEX'}
                            </span>
                        </div>
                    )}
                    <div className="text-[10px] text-zinc-500 space-y-1 uppercase tracking-wider font-bold">
                        <p>{tenant?.address || 'Endereço não configurado'}</p>
                        <p>{tenant?.phone || 'Telefone não configurado'} • {tenant?.email || 'contato@frotex.com'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-extrabold uppercase tracking-tight text-zinc-900 mb-1">Orçamento</h1>
                    <p className="text-sm font-bold text-violet-600">#{quote.quoteCode}</p>
                    <div className="mt-4 text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
                        Emitido em {format(new Date(quote.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </div>
                </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Cliente</h3>
                    <div className="space-y-1">
                        <p className="font-bold text-lg">{quote.customer?.fullName}</p>
                        <p className="text-sm text-zinc-600">{quote.customer?.document || 'CPF/CNPJ não informado'}</p>
                        <p className="text-sm text-zinc-600">{quote.customer?.email}</p>
                        <p className="text-sm text-zinc-600 font-medium">{quote.customer?.phone}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Detalhes da Locação</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Início:</span>
                            <span className="font-bold text-zinc-900">{format(new Date(quote.startDate), "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Retorno Previsto:</span>
                            <span className="font-bold text-zinc-900">{format(new Date(quote.endDateExpected), "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Modalidade:</span>
                            <span className="font-bold text-zinc-900 uppercase text-[10px] tracking-widest">{quote.rentalType || 'diário'}</span>
                        </div>
                        {quote.validUntil && (
                            <div className="flex justify-between text-sm">
                                <span className="text-violet-600 font-bold">Válido até:</span>
                                <span className="font-bold text-violet-600">{format(new Date(quote.validUntil), "dd/MM/yyyy")}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-12">
                <thead>
                    <tr className="border-b border-zinc-200">
                        <th className="text-left py-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Equipamento</th>
                        <th className="text-center py-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Qtd</th>
                        <th className="text-right py-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Diária Unit.</th>
                        <th className="text-right py-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {quote.items?.map((item: any) => (
                        <tr key={item.id} className="border-b border-zinc-100">
                            <td className="py-5">
                                <p className="font-bold text-zinc-900">{item.tool?.name}</p>
                                <p className="text-[10px] text-zinc-500 uppercase font-medium">Patrimônio: {item.tool?.assetTag}</p>
                            </td>
                            <td className="py-5 text-center font-bold text-sm">{item.quantity}</td>
                            <td className="py-5 text-right font-medium text-sm">{formatCurrency(parseFloat(item.dailyRate))}</td>
                            <td className="py-5 text-right font-bold text-zinc-900 text-sm">{formatCurrency(parseFloat(item.totalAmount))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-72 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Subtotal</span>
                        <span className="font-bold">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 font-medium italic">Descontos Consolidados</span>
                            <span className="font-bold text-emerald-600">-{formatCurrency(discount)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t-2 border-zinc-900 flex justify-between items-baseline">
                        <span className="font-extrabold uppercase tracking-tight text-xl">Total final</span>
                        <span className="font-extrabold text-3xl tracking-tight">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Terms */}
            {quote.termsAndConditions && (
                <div className="bg-zinc-50 p-6 rounded-2xl mb-12 border border-zinc-100 italic">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3 not-italic">Observações e Condições</h4>
                    <p className="text-[11px] text-zinc-600 leading-relaxed whitespace-pre-wrap">
                        {quote.termsAndConditions}
                    </p>
                </div>
            )}

            <div className="mt-auto pt-12 border-t border-zinc-100 text-center">
                <p className="text-[9px] text-zinc-400 uppercase tracking-[0.3em] font-extrabold">
                    Gerado automaticamente via Sistema FROTEX
                </p>
            </div>
        </div>
    );
}
