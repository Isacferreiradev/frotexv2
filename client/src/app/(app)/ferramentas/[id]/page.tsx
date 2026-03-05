'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Wrench,
    History,
    TrendingUp,
    AlertTriangle,
    Calendar,
    DollarSign,
    User,
    ArrowLeft,
    Plus,
    Pencil,
    Settings,
    FileText,
    Zap
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/shared/SkeletonLoader';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { ToolForm } from '@/components/forms/ToolForm';

export default function Tool360Page() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data: tool, isLoading } = useQuery({
        queryKey: ['tool-360', id],
        queryFn: async () => {
            const res = await api.get(`/tools/${id}/360`);
            return res.data.data;
        }
    });

    const updateToolMutation = useMutation({
        mutationFn: (data: any) => api.patch(`/tools/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tool-360', id] });
            setIsEditOpen(false);
            toast.success('Equipamento atualizado com sucesso!');
        },
        onError: () => toast.error('Erro ao atualizar equipamento'),
    });

    const createMaintenanceMutation = useMutation({
        mutationFn: (data: any) => api.post('/maintenance', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tool-360', id] });
            setIsMaintenanceOpen(false);
            toast.success('Manutenção registrada com sucesso!');
        },
        onError: () => toast.error('Erro ao registrar manutenção'),
    });

    if (isLoading) return <div className="p-10 container mx-auto"><Skeleton className="h-[600px] w-full rounded-2xl" /></div>;
    if (!tool) return <div className="p-10 text-center">Ferramenta não encontrada.</div>;

    const metrics = tool.metrics;

    return (
        <div className="max-w-[1400px] mx-auto py-10 px-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-white hover:shadow-soft transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
                            <StatusBadge status={tool.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 text-foreground">
                            {tool.brand} • {tool.model} • <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase">{tool.assetTag}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 px-6 bg-white"
                        onClick={() => setIsEditOpen(true)}
                    >
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Editar Ativo
                    </Button>
                    <Button
                        className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 px-6 shadow-premium"
                        onClick={() => setIsMaintenanceOpen(true)}
                    >
                        <Plus className="w-3.5 h-3.5 mr-2" /> Registrar Manutenção
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Saúde do Ativo', value: `${metrics.healthScore}/100`, icon: AlertTriangle, color: metrics.healthScore < 40 ? 'text-red-500' : (metrics.healthScore < 70 ? 'text-amber-500' : 'text-emerald-500'), bg: metrics.healthScore < 40 ? 'bg-red-50' : (metrics.healthScore < 70 ? 'bg-amber-50' : 'bg-emerald-50') },
                    { label: 'Receita Total', value: formatCurrency(metrics.totalRevenue), icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'ROI (Acumulado)', value: `${metrics.roi}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Lucro Líquido', value: formatCurrency(metrics.netProfit), icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-border/40 shadow-soft"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-2 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global</span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-muted/30 p-1.5 rounded-2xl border border-border/40">
                    <TabsTrigger value="overview" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8">Visão Geral</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8">Histórico de Locações</TabsTrigger>
                    <TabsTrigger value="maintenance" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8">Manutenções</TabsTrigger>
                    <TabsTrigger value="technical" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8">Ficha Técnica</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="animate-in fade-in duration-500 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Status Card */}
                        <Card className="lg:col-span-2 rounded-2xl border-border/40 shadow-soft overflow-hidden">
                            <CardHeader className="border-b border-border/10 bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estado do Ativo: {metrics.healthStatus.toUpperCase()}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Uso Atual</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-foreground">{tool.currentUsageHours}h</span>
                                            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Acumuladas</span>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Próxima Revisão</p>
                                        <div className="flex items-baseline gap-2 justify-end">
                                            <span className="text-4xl font-black text-amber-500">{tool.nextMaintenanceDueHours}h</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                        <span>Confiança Operacional</span>
                                        <span className="text-foreground">{metrics.healthScore}%</span>
                                    </div>
                                    <div className="h-4 bg-muted/50 rounded-full overflow-hidden border border-border/40 p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${metrics.healthScore}%` }}
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                metrics.healthScore < 40 ? "bg-red-500" : (metrics.healthScore < 70 ? "bg-amber-500" : "bg-emerald-500")
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Mini-Feed */}
                        <Card className="rounded-2xl border-border/40 shadow-soft">
                            <CardHeader className="border-b border-border/10">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Última Movimentação</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {tool.rentals?.[0] ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/10">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cliente Atual/Último</p>
                                                <p className="text-sm font-bold">{tool.rentals[0].customer.fullName}</p>
                                            </div>
                                        </div>
                                        <Button variant="link" className="text-xs p-0 h-auto font-bold uppercase tracking-widest text-primary hover:no-underline">
                                            Ver Histórico Completo →
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs font-semibold text-muted-foreground text-center py-10">Sem registros recentes.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in duration-500">
                    <Card className="rounded-2xl border-border/40 shadow-soft overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/30 border-b border-border/10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Código</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cliente</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Início</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fim</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {tool.rentals.map((rental: any) => (
                                        <tr key={rental.id} className="hover:bg-muted/5 transition-colors group cursor-pointer" onClick={() => router.push(`/locacoes/${rental.id}`)}>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-[10px] font-bold bg-muted/40 px-2 py-1 rounded">{rental.rentalCode}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold group-hover:text-primary transition-colors">{rental.customer.fullName}</p>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-medium">{format(new Date(rental.startDate), "dd MMM yyyy", { locale: ptBR })}</td>
                                            <td className="px-6 py-5 text-xs font-medium">{format(new Date(rental.endDateExpected), "dd MMM yyyy", { locale: ptBR })}</td>
                                            <td className="px-6 py-5 font-bold text-sm tracking-tight">{formatCurrency(rental.totalAmountActual || rental.totalAmountExpected)}</td>
                                            <td className="px-6 py-5"><StatusBadge status={rental.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="maintenance" className="animate-in fade-in duration-500">
                    <Card className="rounded-2xl border-border/40 shadow-soft overflow-hidden">
                        <div className="p-8 space-y-6">
                            {tool.maintenanceLogs.length > 0 ? (
                                <div className="space-y-4">
                                    {tool.maintenanceLogs.map((log: any) => (
                                        <div key={log.id} className="flex items-start gap-4 p-5 rounded-xl border border-border/10 bg-muted/5 hover:bg-white hover:shadow-soft transition-all">
                                            <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                                                <Wrench className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-bold">{log.description}</p>
                                                    <span className="text-sm font-bold text-amber-600">{formatCurrency(log.cost)}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{log.notes || 'Sem observações adicionais.'}</p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3" /> {format(new Date(log.maintenanceDate), "dd/MM/yyyy")}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                        <User className="w-3 h-3" /> {log.performedByUser?.fullName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 px-8">
                                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
                                        <Wrench className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-2">Sem histórico de manutenção</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Este equipamento ainda não passou por manutenções registradas no sistema.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="technical" className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="rounded-2xl border-border/40 shadow-soft">
                            <CardHeader className="border-b border-border/10">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Informações de Aquisição</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Data de Compra</p>
                                        <p className="text-base font-bold">{tool.acquisitionDate ? format(new Date(tool.acquisitionDate), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Não informado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Custo Inicial</p>
                                        <p className="text-base font-bold text-zinc-900">{formatCurrency(tool.acquisitionCost)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/40 shadow-soft">
                            <CardHeader className="border-b border-border/10">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Configurações Base</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Valor da Diária (Padrão)</p>
                                        <p className="text-base font-bold text-violet-600">{formatCurrency(tool.dailyRate)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Série / Serial</p>
                                        <p className="text-base font-bold font-mono text-zinc-700">{tool.serialNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <SheetContent className="sm:max-w-[800px] border-border/40 p-0 overflow-hidden bg-white shadow-float overflow-y-auto">
                    <div className="px-10 py-10 border-b border-border/40 bg-zinc-50/50">
                        <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Editar Equipamento</SheetTitle>
                        <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Atualizando metadados da frota</SheetDescription>
                    </div>
                    <div className="p-10">
                        <ToolForm
                            initialData={tool}
                            onSubmit={(data) => updateToolMutation.mutate(data)}
                            isLoading={updateToolMutation.isPending}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
                <SheetContent className="sm:max-w-[700px] border-border/40 p-0 overflow-hidden bg-white shadow-float">
                    <div className="px-10 py-10 border-b border-border/40 bg-muted/10">
                        <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Registro de Manutenção</SheetTitle>
                        <SheetDescription className="text-primary font-semibold text-[10px] uppercase tracking-[0.2em] mt-2">Ativo: {tool.name}</SheetDescription>
                    </div>
                    <div className="p-10">
                        <MaintenanceForm
                            initialToolId={tool.id as string}
                            initialToolName={tool.name}
                            onSubmit={(data) => createMaintenanceMutation.mutate(data)}
                            isLoading={createMaintenanceMutation.isPending}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
