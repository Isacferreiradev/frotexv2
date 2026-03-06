'use client';

import { Calendar, User, Wrench, AlertTriangle, MoreVertical, CheckCircle2 } from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { StatusPulse } from './StatusPulse';

interface RentalCardProps {
    rental: any;
    onReturn: (rental: any) => void;
    onCancel: (id: string) => void;
    onDetail?: (rental: any) => void;
}

export function RentalCard({ rental, onReturn, onDetail }: RentalCardProps) {
    const isOverdue = rental.status === 'active' && new Date(rental.endDateExpected) < new Date();

    return (
        <div
            onClick={() => onDetail?.(rental)}
            className={cn(
                "group bg-white rounded-premium border border-border/40 shadow-soft hover:shadow-premium transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer",
                isOverdue && "border-red-100 shadow-red-50/50"
            )}
        >
            {/* Header / Avatar Section */}
            <div className="relative h-20 sm:h-24 bg-slate-50 flex items-center justify-center border-b border-violet-50">
                <div className="flex items-center gap-4">
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-border/40 shadow-sm">
                        <span className="text-[10px] font-semibold text-primary tabular-nums uppercase tracking-widest">#{rental.rentalCode}</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border/40 flex items-center gap-2 shadow-sm">
                        <StatusPulse status={isOverdue ? 'overdue' : rental.status} />
                        <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-[0.2em] leading-none",
                            isOverdue ? "text-red-500" : "text-muted-foreground"
                        )}>
                            {isOverdue ? 'Atrasada' : rental.status === 'active' ? 'Em campo' : 'Finalizada'}
                        </span>
                    </div>
                </div>

                <div className="ml-auto translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button className="w-10 h-10 bg-white rounded-xl border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-sm">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
                {/* Main Info */}
                <div className="space-y-5">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-secondary/30 rounded-2xl flex items-center justify-center border border-primary/5 shrink-0 transition-transform group-hover:scale-105">
                            <Wrench className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5 mt-1">Equipamento</p>
                            <h4 className="font-semibold text-foreground text-[15px] tracking-tight line-clamp-1">{rental.tool?.name}</h4>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0 transition-transform group-hover:scale-105">
                            <User className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5 mt-1">Cliente</p>
                            <h4 className="font-semibold text-foreground text-[15px] tracking-tight line-clamp-1">{rental.customer?.fullName}</h4>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-muted/30 rounded-2xl p-6 border border-border/40 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground/50" />
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Início:</span>
                        </div>
                        <span className="text-[13px] font-semibold text-foreground tabular-nums tracking-tight">{formatDate(rental.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground/50" />
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Expectativa:</span>
                        </div>
                        <span className={cn(
                            "text-[13px] font-semibold tabular-nums tracking-tight",
                            isOverdue ? "text-red-500" : "text-foreground"
                        )}>{formatDate(rental.endDateExpected)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                    {rental.status === 'active' ? (
                        <div className="flex gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReturn(rental);
                                }}
                                className="flex-1 bg-primary text-white rounded-xl py-3 text-[11px] font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-premium active:scale-95"
                            >
                                Devolver Item
                            </button>
                        </div>
                    ) : (
                        <div className="w-full bg-muted/40 border border-border/40 rounded-xl py-3.5 flex items-center justify-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Locação Concluída</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
