'use client';

import { Wrench, MoreVertical, QrCode, Zap } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { StatusPulse } from './StatusPulse';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tool } from '@/types';
import { useRouter } from 'next/navigation';

interface ToolCardProps {
    tool: Tool;
    onEdit: (tool: Tool) => void;
    onStatusChange?: (id: string, status: string) => void;
    onShowQR?: (tool: Tool) => void;
    onCheckout?: (tool: Tool) => void;
    selected?: boolean;
    onSelect?: (id: string) => void;
}

export function ToolCard({ tool, onEdit, onStatusChange, onShowQR, onCheckout, selected, onSelect }: ToolCardProps) {
    const router = useRouter();

    return (
        <div
            onClick={() => onSelect ? onSelect(tool.id) : router.push(`/ferramentas/${tool.id}`)}
            className={cn(
                "group bg-white rounded-premium border border-border shadow-soft hover:shadow-premium transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer hover:border-primary/20",
                selected && "border-primary ring-2 ring-primary/20 bg-primary/5"
            )}
        >
            {/* Header / Image Placeholder */}
            <div className="relative h-32 sm:h-40 bg-muted/50 flex items-center justify-center border-b border-border overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    {onSelect && (
                        <div
                            className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                selected ? "bg-primary border-primary text-white" : "bg-white/50 border-white/80"
                            )}
                        >
                            {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                    )}
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border flex items-center gap-2 shadow-sm">
                        <StatusPulse status={tool.status} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {tool.status === 'available' ? 'Livre' : tool.status === 'rented' ? 'Em Campo' : 'Manutenção'}
                        </span>
                    </div>

                    {onShowQR && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowQR(tool);
                            }}
                            className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 hover:shadow-sm transition-all shadow-sm"
                            title="Ver QR Code"
                        >
                            <QrCode className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <Wrench className="w-10 h-10 text-primary/20 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-500" />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(tool);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-button border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 hover:shadow-sm transition-all opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-8 flex-1 flex flex-col">
                <div className="flex-1">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-[0.2em] mb-2">{tool.categoryName || 'Universal'}</p>
                    <h4 className="font-semibold text-foreground text-[15px] tracking-tight leading-tight group-hover:text-primary transition-colors">
                        {tool.name}
                    </h4>
                    <p className="text-[10px] font-medium text-muted-foreground mt-2 uppercase tracking-tight">
                        {tool.brand} • {tool.assetTag || 'Sem Tag'}
                    </p>
                </div>

                <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-border/40 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.15em] leading-none">Diária</p>
                        <p className="text-[15px] font-semibold text-foreground tabular-nums tracking-tight">{formatCurrency(tool.dailyRate)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {onCheckout && tool.status === 'available' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCheckout(tool);
                                }}
                                className="bg-primary text-white rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 shadow-premium group/btn"
                            >
                                <Zap className="w-3.5 h-3.5 fill-current transition-transform group-hover/btn:scale-110" />
                                <span className="text-[10px] font-semibold uppercase tracking-widest leading-none">Alugar</span>
                            </button>
                        )}

                        {onStatusChange && tool.status === 'available' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(tool.id, 'maintenance');
                                }}
                                className="bg-secondary/40 text-primary rounded-xl w-10 h-10 flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-white"
                                title="Enviar para Manutenção"
                            >
                                <Wrench className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
