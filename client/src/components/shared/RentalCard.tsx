'use client';

import { Calendar, User, Wrench, AlertTriangle, MoreVertical, CheckCircle2, Trash2, Zap } from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { StatusPulse } from './StatusPulse';
import { Rental } from '@/types';

interface RentalCardProps {
    rental: Rental;
    onReturn: (rental: Rental) => void;
    onCancel: (id: string) => void;
    onDetail?: (rental: Rental) => void;
    onDelete?: (id: string) => void;
}

export function RentalCard({ rental, onReturn, onCancel, onDetail, onDelete }: RentalCardProps) {
    const isOverdue = rental.status === 'active' && new Date(rental.endDateExpected) < new Date();

    return (
        <div
            onClick={() => onDetail?.(rental)}
            className={cn(
                "group bg-white rounded-[2.5rem] border border-violet-100 shadow-[0_10px_40px_rgba(124,58,237,0.04)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.1)] transition-all duration-500 overflow-hidden flex flex-col h-full cursor-pointer hover:-translate-y-1 relative",
                isOverdue && "border-red-100 shadow-red-50/50"
            )}
        >
            {/* Header / Accent Section */}
            <div className="relative h-28 bg-gradient-to-br from-violet-50/50 to-white flex items-center justify-center border-b border-violet-50/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-200/20 blur-[30px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-400/20 transition-all duration-700" />

                <div className="absolute top-5 left-6 z-10 flex gap-2">
                    <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/80 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                        <StatusPulse status={isOverdue ? 'overdue' : rental.status} />
                        <span className={cn(
                            "text-[10px] font-extrabold uppercase tracking-[0.15em] leading-none",
                            isOverdue ? "text-red-500" : "text-zinc-500"
                        )}>
                            {isOverdue ? 'Atrasada' : rental.status === 'active' ? 'Em campo' : 'Finalizada'}
                        </span>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/60 shadow-sm z-10 transition-transform group-hover:scale-110">
                    <span className="text-[10px] font-black text-violet-600 tabular-nums uppercase tracking-widest">#{rental.rentalCode}</span>
                </div>

                <div className="absolute top-5 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-20">
                    {rental.status === 'active' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancel(rental.id);
                            }}
                            className="w-10 h-10 bg-white/90 backdrop-blur-xl rounded-2xl border border-white flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-100 hover:shadow-premium transition-all"
                            title="Cancelar Locação"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-7 sm:p-9 flex-1 flex flex-col">
                <div className="space-y-6 flex-1">
                    <div className="flex gap-5 items-start">
                        <div className="w-14 h-14 bg-violet-50 rounded-[1.25rem] flex items-center justify-center border border-violet-100 shrink-0 transition-all group-hover:scale-110 group-hover:rotate-6 shadow-sm">
                            <Wrench className="w-7 h-7 text-violet-600" />
                        </div>
                        <div className="space-y-1.5 py-1">
                            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.2em] leading-none">Equipamento</p>
                            <h4 className="font-bold text-zinc-900 text-[17px] tracking-tight line-clamp-1 group-hover:text-violet-600 transition-colors">{rental.tool?.name}</h4>
                        </div>
                    </div>

                    <div className="flex gap-5 items-start">
                        <div className="w-14 h-14 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center border border-emerald-100 shrink-0 transition-all group-hover:scale-110 group-hover:-rotate-6 shadow-sm">
                            <User className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="space-y-1.5 py-1">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] leading-none">Cliente Parceiro</p>
                            <h4 className="font-bold text-zinc-900 text-[17px] tracking-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">{rental.customer?.fullName}</h4>
                        </div>
                    </div>

                    {/* Timeline with Modern Styling */}
                    <div className="bg-zinc-50/50 rounded-[1.75rem] p-6 border border-zinc-100/80 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4.5 h-4.5 text-zinc-300" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Início:</span>
                            </div>
                            <span className="text-[13px] font-extrabold text-zinc-900 tabular-nums tracking-tight">{formatDate(rental.startDate)}</span>
                        </div>
                        <div className="h-[1px] bg-zinc-200/50 w-full" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4.5 h-4.5 text-zinc-300" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Devolução:</span>
                            </div>
                            <span className={cn(
                                "text-[13px] font-extrabold tabular-nums tracking-tight",
                                isOverdue ? "text-red-500" : "text-zinc-900"
                            )}>
                                {rental.endDateActual ? formatDate(rental.endDateActual) : formatDate(rental.endDateExpected)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="mt-8 pt-7 border-t border-zinc-50 flex items-center gap-4">
                    {rental.status === 'active' ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReturn(rental);
                            }}
                            className="flex-1 bg-violet-600 text-white rounded-2xl py-4.5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-violet-700 transition-all shadow-[0_10px_25px_rgba(124,58,237,0.2)] hover:shadow-[0_15px_30px_rgba(124,58,237,0.3)] active:scale-95 flex items-center justify-center gap-2 group/btn"
                        >
                            <Zap className="w-4 h-4 text-violet-200 fill-violet-200 group-hover/btn:scale-110 group-hover/btn:text-white group-hover/btn:fill-white transition-all" />
                            Devolver Ativo
                        </button>
                    ) : (
                        <div className="flex-1 flex gap-4">
                            <div className="flex-1 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl py-4.5 flex items-center justify-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Encerrada</span>
                            </div>
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(rental.id);
                                    }}
                                    className="w-14 h-14 flex items-center justify-center bg-white border border-zinc-100 text-zinc-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/50 rounded-2xl transition-all active:scale-95 shrink-0 shadow-sm"
                                    title="Excluir Permanentemente"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
