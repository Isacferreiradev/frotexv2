'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, Clock, Hammer, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Alert {
    id: string;
    type: 'overdue_rental' | 'expiring_quote' | 'maintenance_due' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    link: string;
    createdAt: string;
}

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: alerts, isLoading } = useQuery({
        queryKey: ['alerts'],
        queryFn: async () => {
            const res = await api.get('/activity/alerts');
            return res.data.data as Alert[];
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = alerts?.length || 0;

    const getIcon = (type: string) => {
        switch (type) {
            case 'overdue_rental': return <Clock className="w-4 h-4 text-red-500" />;
            case 'maintenance_due': return <Hammer className="w-4 h-4 text-amber-500" />;
            case 'expiring_quote': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
            default: return <Bell className="w-4 h-4 text-zinc-400" />;
        }
    };

    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 border-red-100';
            case 'high': return 'bg-amber-50 border-amber-100';
            case 'medium': return 'bg-blue-50 border-blue-100';
            default: return 'bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2.5 rounded-xl transition-all duration-300 relative group",
                    isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
            >
                <Bell className={cn("w-5 h-5 transition-transform duration-500", isOpen && "rotate-[15deg] scale-110")} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] items-center justify-center text-white font-bold">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute right-0 mt-4 w-[380px] bg-white rounded-2xl shadow-float border border-border/40 overflow-hidden z-[100]"
                    >
                        <div className="px-6 py-5 border-b border-border/40 bg-zinc-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="text-[13px] font-bold text-foreground">Alertas Ativos</h3>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Notificações do Sistema</p>
                            </div>
                            {unreadCount > 0 && (
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} pendentes
                                </span>
                            )}
                        </div>

                        <div className="max-h-[420px] overflow-y-auto no-scrollbar">
                            {isLoading ? (
                                <div className="p-10 text-center">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-xs text-muted-foreground font-medium">Sincronizando alertas...</p>
                                </div>
                            ) : alerts && alerts.length > 0 ? (
                                <div className="divide-y divide-border/20">
                                    {alerts.map((alert) => (
                                        <Link
                                            key={alert.id}
                                            href={alert.link}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex gap-4 p-5 hover:bg-zinc-50/80 transition-all group border-l-4 border-l-transparent",
                                                alert.severity === 'critical' ? "hover:border-l-red-500" :
                                                    alert.severity === 'high' ? "hover:border-l-amber-500" : "hover:border-l-primary"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                                getSeverityClass(alert.severity)
                                            )}>
                                                {getIcon(alert.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-[13px] font-bold text-foreground line-clamp-1">{alert.title}</h4>
                                                    <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ptBR })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                                    {alert.description}
                                                </p>
                                            </div>
                                            <ExternalLink className="w-3.5 h-3.5 text-zinc-300 group-hover:text-primary transition-colors mt-1" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 px-10 text-center animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100/50">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">Tudo em ordem!</h4>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        Não há alertas críticos ou pendências no momento. Sua frota está rodando perfeitamente.
                                    </p>
                                </div>
                            )}
                        </div>

                        {alerts && alerts.length > 0 && (
                            <div className="p-4 bg-zinc-50/50 border-t border-border/40">
                                <button className="w-full py-2.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-[0.15em]">
                                    Marcar tudo como lido
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
