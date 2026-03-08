'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PenToolIcon, CheckCircle2, AlertTriangle, Loader2, PenTool, LayoutDashboard, History, Wrench, Settings2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPulse } from '@/components/shared/StatusPulse';
import { MaintenanceCard } from '@/components/shared/MaintenanceCard';
import { Button } from '@/components/ui/button';

export default function ManutencaoPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [finalizingTool, setFinalizingTool] = useState<{ id: string, name: string } | null>(null);
    const queryClient = useQueryClient();

    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['maintenance-logs'],
        queryFn: async () => {
            const res = await api.get('/maintenance/logs');
            return res.data.data;
        },
    });

    const { data: dueTools, isLoading: dueLoading } = useQuery({
        queryKey: ['maintenance', 'due'],
        queryFn: async () => {
            const res = await api.get('/maintenance/tools-due');
            return res.data.data;
        },
    });

    const logMutation = useMutation({
        mutationFn: (data: any) => api.post('/maintenance/logs', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance', 'due'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setIsSheetOpen(false);
            toast.success('Manutenção registrada com sucesso!');
        },
        onError: () => toast.error('Erro ao registrar manutenção'),
    });

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-10 px-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">Manutenção Preditiva</h1>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] flex items-center gap-2 mt-3">
                        <Settings2 className="w-3.5 h-3.5" /> Saúde & Longevidade dos Ativos
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <button
                            onClick={() => {
                                setFinalizingTool(null);
                                setIsSheetOpen(true);
                            }}
                            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-[11px] uppercase tracking-widest transition-all shadow-premium"
                        >
                            <PenToolIcon className="w-4.5 h-4.5" />
                            Registrar Manutenção
                        </button>
                        <SheetContent className="sm:max-w-[600px] border-border/40 p-0 overflow-hidden bg-white shadow-float text-foreground">
                            <div className="px-10 py-10 border-b border-border/40 bg-muted/10">
                                <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Log de Serviço</SheetTitle>
                                <SheetDescription className="text-primary font-semibold text-[10px] uppercase tracking-[0.2em] mt-2">Atualização de Status & Custos</SheetDescription>
                            </div>
                            <div className="p-10">
                                <MaintenanceForm
                                    key={finalizingTool?.id || 'new'}
                                    initialToolId={finalizingTool?.id}
                                    initialToolName={finalizingTool?.name}
                                    onSubmit={(data) => logMutation.mutate(data)}
                                    isLoading={logMutation.isPending}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Due for Maintenance - Left Column */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerta de Revisão
                        </h3>
                        {dueTools && dueTools.length > 0 && (
                            <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold tabular-nums">
                                {dueTools.length}
                            </span>
                        )}
                    </div>

                    {dueLoading ? (
                        <div className="space-y-6">
                            {Array(3).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : !dueTools || dueTools.length === 0 ? (
                        <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-3xl p-10 text-center shadow-soft">
                            <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-4" />
                            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.1em] leading-relaxed">Sua frota está<br />100% operacional</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {dueTools.map((tool: any) => (
                                <div key={tool.id} className="relative bg-white rounded-2xl p-6 border border-border/40 shadow-soft overflow-hidden group hover:border-amber-300 transition-all duration-300">
                                    <div className="absolute top-0 right-0 p-4 flex gap-2 items-center">
                                        <StatusPulse status={tool.status === 'maintenance' ? 'maintenance' : 'pending'} className="h-3 w-3" />
                                        {tool.status === 'maintenance' && (
                                            <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Em Manutenção</span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-foreground text-[14px] tracking-tight">{tool.name}</h4>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-1.5 uppercase tracking-tight">{tool.brand} • {tool.assetTag}</p>

                                    {tool.currentUsageHours && (
                                        <div className="mt-6">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Desgaste</span>
                                                <span className="text-[11px] font-semibold text-amber-600 tabular-nums">
                                                    {tool.currentUsageHours}h / {tool.nextMaintenanceDueHours}h
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-border/40">
                                                <div
                                                    className="h-full bg-amber-400 group-hover:bg-amber-500 transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (tool.currentUsageHours / (tool.nextMaintenanceDueHours || 100)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all">
                                        <Button
                                            onClick={() => {
                                                setFinalizingTool({ id: tool.id, name: tool.name });
                                                setIsSheetOpen(true);
                                            }}
                                            className="w-full bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white border border-violet-100 font-bold text-[10px] uppercase tracking-widest h-10 rounded-xl"
                                        >
                                            {tool.status === 'maintenance' ? 'Finalizar Manutenção' : 'Iniciar Manutenção'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Maintenance History - Right Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                            <History className="w-4 h-4 text-primary" /> Histórico de Atividades
                        </h3>
                    </div>

                    {logsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Array(6).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-48 rounded-premium" />
                            ))}
                        </div>
                    ) : !logsData || logsData.length === 0 ? (
                        <EmptyState
                            icon={PenTool}
                            title="Nenhum log registrado"
                            description="Tudo limpo por aqui. Registre sua primeira manutenção para começar o rastreio."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {logsData.map((log: any) => (
                                <MaintenanceCard key={log.id} log={log} />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
