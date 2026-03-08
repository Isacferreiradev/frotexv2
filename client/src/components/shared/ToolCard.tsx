'use client';

import { Wrench, MoreVertical, QrCode, Zap, Trash2, Pencil } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { StatusPulse } from './StatusPulse';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tool } from '@/types';
import { useRouter } from 'next/navigation';

interface ToolCardProps {
    tool: Tool;
    onEdit: (tool: Tool) => void;
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, status: string) => void;
    onShowQR?: (tool: Tool) => void;
    onCheckout?: (tool: Tool) => void;
    selected?: boolean;
    onSelect?: (id: string) => void;
}

export function ToolCard({ tool, onEdit, onDelete, onStatusChange, onShowQR, onCheckout, selected, onSelect }: ToolCardProps) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/ferramentas/${tool.id}`)}
            className={cn(
                "group bg-white rounded-[2rem] border border-violet-100 shadow-[0_10px_40px_rgba(124,58,237,0.06)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.12)] transition-all duration-500 overflow-hidden flex flex-col h-full cursor-pointer hover:-translate-y-1 relative",
                selected && "border-primary ring-2 ring-primary/10 bg-violet-50/30"
            )}
        >
            {/* Header / Image Placeholder */}
            <div className="relative h-40 sm:h-48 bg-gradient-to-br from-violet-50 to-white flex items-center justify-center border-b border-violet-50 overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/20 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-400/20 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-100/30 blur-[30px] rounded-full translate-y-1/2 -translate-x-1/2 group-hover:bg-violet-300/30 transition-all duration-700" />

                <div className="absolute top-5 left-5 z-10 flex gap-2">
                    {onSelect && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(tool.id);
                            }}
                            className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                                selected ? "bg-violet-600 border-violet-600 text-white scale-110 shadow-lg shadow-violet-200" : "bg-white/40 backdrop-blur-md border-white/80"
                            )}
                        >
                            {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                    )}
                    <div className="bg-white/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/80 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-violet-50/50">
                        <StatusPulse status={tool.status} />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-zinc-600">
                            {tool.status === 'available' ? 'Disponível' : tool.status === 'rented' ? 'Locado' : 'Manutenção'}
                        </span>
                    </div>

                    {onShowQR && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowQR(tool);
                            }}
                            className="w-9 h-9 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 flex items-center justify-center text-zinc-500 hover:text-violet-600 hover:border-violet-200 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                            title="Ver QR Code"
                        >
                            <QrCode className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <Wrench className="w-12 h-12 text-violet-200 group-hover:scale-110 group-hover:rotate-12 group-hover:text-violet-400 transition-all duration-700 ease-[0.34,1.56,0.64,1]" />

                <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(tool);
                        }}
                        className="w-9 h-9 bg-white/80 backdrop-blur-xl rounded-2xl border border-white flex items-center justify-center text-zinc-400 hover:text-violet-600 hover:border-violet-100 hover:shadow-premium transition-all"
                        title="Editar"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(tool.id);
                            }}
                            className="w-9 h-9 bg-white/80 backdrop-blur-xl rounded-2xl border border-white flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-100 hover:shadow-premium transition-all"
                            title="Excluir"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="h-1 w-1 rounded-full bg-violet-400" />
                        <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] leading-none">{tool.categoryName || 'Universal'}</p>
                    </div>
                    <h4 className="font-bold text-zinc-900 text-[17px] tracking-tight leading-tight group-hover:text-violet-600 transition-colors duration-300">
                        {tool.name}
                    </h4>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="text-[11px] font-medium text-zinc-400 border border-zinc-100 px-2 py-0.5 rounded-lg">{tool.brand}</span>
                        <span className="text-[11px] font-medium text-zinc-400 border border-zinc-100 px-2 py-0.5 rounded-lg">#{tool.assetTag || 'Sem Tag'}</span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-violet-50/50 flex flex-col items-stretch sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] leading-none">Investimento/Dia</p>
                        <p className="text-[20px] font-extrabold text-zinc-900 tabular-nums tracking-tighter">{formatCurrency(tool.dailyRate)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {onCheckout && tool.status === 'available' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCheckout(tool);
                                }}
                                className="flex-1 sm:flex-none bg-violet-600 text-white rounded-[1.25rem] px-5 py-4 flex items-center justify-center gap-2.5 hover:bg-violet-700 transition-all duration-500 shadow-[0_10px_25px_rgba(124,58,237,0.25)] hover:shadow-[0_15px_30px_rgba(124,58,237,0.35)] hover:-translate-y-1 active:scale-95 group/btn"
                            >
                                <Zap className="w-4 h-4 text-violet-200 fill-violet-200 transition-all duration-500 group-hover/btn:scale-110 group-hover/btn:text-white group-hover/btn:fill-white" />
                                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] leading-none whitespace-nowrap">Alugar</span>
                            </button>
                        )}

                        {onStatusChange && tool.status === 'available' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(tool.id, 'maintenance');
                                }}
                                className="bg-zinc-50 text-zinc-400 rounded-2xl w-12 h-12 flex items-center justify-center transition-all duration-500 hover:bg-violet-50 hover:text-violet-600 hover:shadow-inner shrink-0"
                                title="Enviar para Manutenção"
                            >
                                <Wrench className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
