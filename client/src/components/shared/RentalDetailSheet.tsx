'use client';

import {
    X, Calendar, User, Wrench, DollarSign,
    Clock, FileText,
    LucideIcon, ExternalLink
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RentalDetailSheetProps {
    rental: any;
    isOpen: boolean;
    onClose: () => void;
}

export function RentalDetailSheet({ rental, isOpen, onClose }: RentalDetailSheetProps) {
    const router = useRouter();
    if (!rental) return null;

    const isOverdue = rental.status === 'active' && new Date(rental.endDateExpected) < new Date();

    const InfoBlock = ({ icon: Icon, label, value, colorClass }: { icon: LucideIcon, label: string, value: string | number, colorClass?: string }) => (
        <div className="flex gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-100/50">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass || "bg-white border border-zinc-100 text-zinc-400 font-bold")}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest leading-none mb-1.5 mt-0.5">{label}</p>
                <h4 className="font-bold text-zinc-900 text-sm tracking-tight">{value}</h4>
            </div>
        </div>
    );

    return (
        <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="sm:max-w-[600px] p-0 border-none bg-white shadow-2xl flex flex-col h-full overflow-hidden">
                {/* Header Section */}
                <div className="relative px-10 py-12 bg-zinc-900 text-white shrink-0 overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-white/10">
                                    #{rental.rentalCode}
                                </span>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5",
                                    isOverdue ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                )}>
                                    {isOverdue ? 'Atrasada' : rental.status === 'active' ? 'Em Campo' : 'Finalizada'}
                                </div>
                            </div>
                            <SheetTitle className="text-3xl font-extrabold tracking-tight mt-4 text-white">{rental.tool?.name}</SheetTitle>
                            <SheetDescription className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Detalhes da Operação</SheetDescription>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
                    {/* Key Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InfoBlock
                            icon={DollarSign}
                            label="Valor Previsto"
                            value={formatCurrency(rental.totalAmountExpected)}
                            colorClass="bg-violet-500 text-white shadow-lg shadow-violet-100"
                        />
                        <InfoBlock
                            icon={Clock}
                            label="Período"
                            value={`${rental.totalDaysExpected} Dias (${rental.rentalType})`}
                            colorClass="bg-zinc-800 text-white"
                        />
                    </div>

                    {/* Timeline Interaction */}
                    <div className="space-y-6">
                        <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Linha do Tempo
                        </h5>
                        <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100">
                            <div className="relative">
                                <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Início da Locação</p>
                                <p className="text-sm font-bold text-zinc-900">{formatDate(rental.startDate)}</p>
                            </div>
                            <div className="relative">
                                <div className={cn(
                                    "absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm",
                                    isOverdue ? "bg-red-500" : "bg-violet-500"
                                )} />
                                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Previsão de Retorno</p>
                                <div className="flex items-center gap-2">
                                    <p className={cn("text-sm font-bold", isOverdue ? "text-red-500" : "text-zinc-900")}>
                                        {formatDate(rental.endDateExpected)}
                                    </p>
                                    {isOverdue && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded font-extrabold">ATRASADO</span>}
                                </div>
                            </div>
                            {rental.endDateActual && (
                                <div className="relative">
                                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-zinc-900 border-4 border-white shadow-sm" />
                                    <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Retorno Realizado</p>
                                    <p className="text-sm font-bold text-zinc-900">{formatDate(rental.endDateActual)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer 360 & Quick Actions */}
                    <div className="p-8 rounded-[32px] bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl shadow-violet-100 flex flex-col md:flex-row items-center gap-6 group">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                            <User className="w-8 h-8" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-lg font-extrabold tracking-tight">{rental.customer?.fullName}</h4>
                            <p className="text-violet-100 text-xs font-medium uppercase tracking-widest mt-1">Clique para Perfil 360º</p>
                        </div>
                        <Button
                            variant="secondary"
                            className="rounded-xl font-bold text-[10px] uppercase tracking-widest px-6 h-12 bg-white text-violet-600 hover:bg-violet-50 transition-all shadow-lg shadow-black/10 active:scale-95"
                            onClick={() => router.push(`/clientes/${rental.customerId}`)}
                        >
                            Ver Cliente <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="space-y-6 pt-4">
                        <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <DollarSign className="w-3 h-3" /> Resumo Financeiro
                        </h5>
                        <div className="rounded-3xl border border-zinc-100 overflow-hidden">
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm font-medium text-zinc-500">
                                    <span>Base da Locação:</span>
                                    <span className="font-bold text-zinc-900">{formatCurrency(rental.totalAmountExpected)}</span>
                                </div>
                                {parseFloat(rental.securityDeposit || '0') > 0 && (
                                    <div className="flex justify-between text-sm font-medium text-zinc-500">
                                        <span>Caução Recebido:</span>
                                        <span className="font-bold text-zinc-900">{formatCurrency(rental.securityDeposit)}</span>
                                    </div>
                                )}
                                {parseFloat(rental.discountValue || '0') > 0 && (
                                    <div className="flex justify-between text-sm font-medium text-emerald-600 bg-emerald-50/50 p-2 rounded-lg">
                                        <span>Desconto (-):</span>
                                        <span className="font-bold">{formatCurrency(rental.discountValue)}</span>
                                    </div>
                                )}
                                {parseFloat(rental.overdueFineAmount || '0') > 0 && (
                                    <div className="flex justify-between text-sm font-medium text-red-500 bg-red-50/50 p-2 rounded-lg">
                                        <span>Multas (+):</span>
                                        <span className="font-bold">{formatCurrency(rental.overdueFineAmount)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-5 bg-zinc-950 text-white flex justify-between items-center">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Total Acumulado</span>
                                <span className="text-2xl font-extrabold italic">{formatCurrency(rental.totalAmountActual || rental.totalAmountExpected)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Details */}
                    <div className="space-y-6 pt-4">
                        <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Wrench className="w-3 h-3" /> Detalhes Técnicos
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Condição de Saída</p>
                                <p className="text-sm font-bold text-zinc-900 capitalize">{rental.equipmentCondition || 'Não informada'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Tipo de Locação</p>
                                <p className="text-sm font-bold text-zinc-900 capitalize">{rental.rentalType}</p>
                            </div>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    {(rental.internalNotes || rental.customerNotes || rental.notes) && (
                        <div className="space-y-6 pt-4">
                            <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Observações do Contrato
                            </h5>
                            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 text-amber-900/80 text-xs italic leading-relaxed">
                                {rental.internalNotes || rental.customerNotes || rental.notes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-zinc-100 flex gap-4 bg-zinc-50/50">
                    {rental.status === 'active' && (
                        <Button
                            className="flex-1 rounded-2xl h-14 bg-zinc-900 text-white font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-zinc-200"
                            onClick={() => router.push(`/locacoes?id=${rental.id}&action=return`)}
                        >
                            Processar Devolução
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="flex-1 rounded-2xl h-14 border-zinc-200 text-zinc-500 font-bold text-[11px] uppercase tracking-widest"
                        onClick={() => window.open(`/api/rentals/${rental.id}/contract`, '_blank')}
                    >
                        Imprimir Contrato
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
