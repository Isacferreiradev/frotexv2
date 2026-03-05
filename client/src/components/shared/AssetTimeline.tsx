'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Wrench, ArrowRightLeft, User, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineEvent = {
    id: string;
    type: 'rented' | 'returned' | 'maintenance_start' | 'maintenance_end' | 'created' | 'status_change';
    date: string | Date;
    user?: string;
    description: string;
    metadata?: any;
};

interface AssetTimelineProps {
    events: TimelineEvent[];
    loading?: boolean;
}

const EVENT_CONFIG = {
    rented: {
        icon: ArrowRightLeft,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        label: 'Locado'
    },
    returned: {
        icon: ArrowRightLeft,
        color: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-100',
        label: 'Devolvido'
    },
    maintenance_start: {
        icon: Wrench,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        label: 'Em Manutenção'
    },
    maintenance_end: {
        icon: Wrench,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        label: 'Manutenção Concluída'
    },
    created: {
        icon: PlusCircle, // Need to handle missing icon or use generic
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        label: 'Cadastrado'
    },
    status_change: {
        icon: Clock,
        color: 'text-slate-500',
        bg: 'bg-slate-50',
        border: 'border-slate-100',
        label: 'Alteração de Status'
    }
};

import { PlusCircle } from 'lucide-react';

export function AssetTimeline({ events, loading }: AssetTimelineProps) {
    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/4" />
                            <div className="h-3 bg-muted rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
                    <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-foreground text-sm uppercase tracking-tight">Sem histórico</h4>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Este item ainda não possui movimentações registradas.</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
            {events.map((event, index) => {
                const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.status_change;
                const Icon = config.icon;

                return (
                    <div key={event.id} className="relative flex items-start gap-6 group">
                        <div className={cn(
                            "absolute left-0 w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                            config.bg,
                            config.color
                        )}>
                            <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 pt-0.5 pl-10">
                            <div className="flex items-center justify-between gap-4">
                                <span className={cn(
                                    "text-[9px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded border mb-2 inline-block",
                                    config.bg,
                                    config.color,
                                    config.border
                                )}>
                                    {config.label}
                                </span>
                                <time className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                    {format(new Date(event.date), "dd MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                </time>
                            </div>

                            <h5 className="text-sm font-bold text-foreground mb-1">
                                {event.description}
                            </h5>

                            {event.user && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    <span className="text-[10px] font-semibold">{event.user}</span>
                                </div>
                            )}

                            {event.metadata?.notes && (
                                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50 italic text-[11px] text-muted-foreground">
                                    "{event.metadata.notes}"
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
