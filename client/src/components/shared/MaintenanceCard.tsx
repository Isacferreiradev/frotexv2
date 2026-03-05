'use client';

import { Wrench, Calendar, PenTool, ArrowRight, DollarSign, Clock } from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { StatusPulse } from './StatusPulse';

interface MaintenanceCardProps {
    log: any;
}

export function MaintenanceCard({ log }: MaintenanceCardProps) {
    return (
        <div className="group bg-white rounded-[24px] border border-violet-50 premium-shadow hover-scale overflow-hidden p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center border border-violet-100 shrink-0">
                        <Wrench className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-900 text-sm tracking-tight line-clamp-1 group-hover:text-violet-600 transition-colors">
                            {log.tool?.name}
                        </h4>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                            {log.tool?.brand} • {log.tool?.serialNumber}
                        </p>
                    </div>
                </div>
            </div>

            {/* Service Info */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-1">
                <div className="flex items-start gap-2">
                    <PenTool className="w-3.5 h-3.5 text-violet-400 mt-0.5" />
                    <p className="text-xs text-zinc-600 font-medium leading-relaxed line-clamp-2">
                        {log.description}
                    </p>
                </div>
                {log.notes && (
                    <p className="text-[10px] text-zinc-400 mt-2 italic">"{log.notes}"</p>
                )}
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">Concluído em</span>
                        <span className="text-[10px] font-bold text-zinc-900 tabular-nums">{formatDate(log.maintenanceDate)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">Custo OS</span>
                        <span className="text-[10px] font-bold text-emerald-600 tabular-nums">{formatCurrency(log.cost)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
