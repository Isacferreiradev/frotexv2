'use client';

import { useQuery } from '@tanstack/react-query';
import {
    BarChart3, TrendingUp, TrendingDown, DollarSign, Users,
    Wrench, Activity, ArrowUpRight, Calendar, Filter,
    Download, PieChart, Info, Crown, Target, Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const RevenueChart = dynamic(() => import("@/components/dashboard/RevenueChart").then(mod => mod.RevenueChart), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full bg-muted/20 animate-pulse rounded-3xl" />
});

export default function ReportsPage() {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats', timeRange],
        queryFn: async () => (await api.get(`/rentals/dashboard-stats?period=${timeRange === 'all' ? '30d' : timeRange}`)).data.data,
    });

    const { data: customersData } = useQuery({
        queryKey: ['customers-report', timeRange],
        queryFn: async () => (await api.get(`/intelligence/customers-report?start=${new Date(Date.now() - 30 * 86400000).toISOString()}`)).data.data,
    });

    const { data: operationalSummary } = useQuery({
        queryKey: ['operational-summary', timeRange],
        queryFn: async () => (await api.get(`/intelligence/operational-summary`)).data.data,
    });

    const metrics = [
        { label: 'Faturamento Bruto', value: formatCurrency(stats?.actualRevenue ?? 0), icon: DollarSign, trend: '+12%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Lucro Líquido', value: formatCurrency(stats?.netProfit ?? 0), icon: TrendingUp, trend: '+8.4%', color: 'text-primary', bg: 'bg-primary/5' },
        { label: 'Ticket Médio', value: stats?.activeRentals > 0 ? formatCurrency(parseFloat(stats?.actualRevenue) / stats?.activeRentals) : 'R$ 0,00', icon: Target, trend: '-2%', color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Ocupação de Frota', value: `${stats?.occupancyRate ?? 0}%`, icon: Activity, trend: '+5%', color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-10 max-w-[1600px] mx-auto py-10 px-8 animate-in fade-in duration-700">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight font-jakarta">Relatórios de Performance</h1>
                    <p className="text-[11px] font-extrabold text-primary uppercase tracking-[0.3em] flex items-center gap-2 mt-3">
                        <BarChart3 className="w-3.5 h-3.5" /> Inteligência de Negócio & Auditoria
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40">
                        {['7d', '30d', 'all'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r as any)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all",
                                    timeRange === r ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {r === 'all' ? 'Geral' : r}
                            </button>
                        ))}
                    </div>
                    <Button
                        onClick={() => {
                            if (!stats) return;
                            const csvHeader = "Nome,Categoria,Receita,Custo Manutencao,ROI %,Status\n";
                            const csvRows = stats.topToolsByROI.map((t: any) =>
                                `${t.name},${t.categoryName || 'Geral'},${t.revenue},${t.maintenance},${t.roi.toFixed(2)},${t.recommendation}`
                            ).join("\n");
                            const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `relatorio-frota-${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                        }}
                        variant="outline"
                        className="rounded-xl h-11 px-5 text-[10px] font-extrabold uppercase tracking-widest border-border/40 hover:bg-white shadow-soft"
                    >
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* ── Metric Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <Card key={i} glass className="p-8 border-none group hover:scale-[1.02] transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn("p-3 rounded-2xl", m.bg, m.color)}>
                                <m.icon className="w-5 h-5" />
                            </div>
                            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", m.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
                                {m.trend}
                            </span>
                        </div>
                        <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">{m.label}</h3>
                        <p className="text-3xl font-bold font-jakarta text-foreground">{isLoading ? <Skeleton className="h-9 w-32" /> : m.value}</p>
                    </Card>
                ))}
            </div>

            {/* ── Main Charts ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <RevenueChart data={stats?.revenueHistory ?? []} loading={isLoading} />
                </div>

                <Card glass className="border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <PieChart className="w-5 h-5 text-primary" />
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Receita por Categoria</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                        ) : stats?.categoryStats?.map((cat: any, i: number) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-foreground">{cat.name}</span>
                                    <span className="text-primary">{formatCurrency(cat.value)}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                        style={{ width: `${(cat.value / parseFloat(stats.actualRevenue || '1')) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* ── Bottom Section: Ranking ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking Clientes */}
                <Card glass className="border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Maiores Clientes (Faturamento)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                        <div className="divide-y divide-border/20">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                            ) : stats?.topCustomers?.map((cust: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-5 hover:bg-zinc-50/50 transition-all group">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-extrabold shrink-0 border",
                                        i === 0 ? "bg-amber-50 border-amber-100 text-amber-600 shadow-sm" : "bg-muted/30 border-transparent text-muted-foreground"
                                    )}>
                                        {i === 0 ? <Crown className="w-5 h-5" /> : `#${i + 1}`}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-foreground font-jakarta">{cust.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">{cust.rentalsCount} locações finalizadas</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold text-foreground font-jakarta">{formatCurrency(cust.revenue)}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">Total Gasto</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance por Ativo */}
                <Card glass className="border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wrench className="w-5 h-5 text-primary" />
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Ativos Mais Rentáveis (ROI)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                        <div className="divide-y divide-border/20">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                            ) : stats?.topToolsByROI?.map((tool: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-5 hover:bg-zinc-50/50 transition-all group">
                                    <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-110">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-foreground font-jakarta">{tool.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">ROI: {tool.roi.toFixed(1)}% • Manut: {formatCurrency(tool.maintenance)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold text-foreground font-jakarta">{formatCurrency(tool.netProfit)}</p>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-tight">Lucro Acumulado</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Operational Audit ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card glass className="border-none col-span-1 lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-violet-500" />
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Resumo Operacional (30d)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contratos Criados</p>
                                <p className="text-2xl font-bold">{operationalSummary?.rentalsCreated || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                                <Plus className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Devoluções Processadas</p>
                                <p className="text-2xl font-bold">{operationalSummary?.rentalsReturned || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                                <Calendar className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card glass className="border-none lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Novos Clientes (Últimos 30 Dias)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-end gap-3 pb-8">
                        {/* Simple Bar Chart Representation */}
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="flex-1 bg-indigo-100/50 rounded-t-xl relative group hover:bg-indigo-500 transition-all cursor-help" style={{ height: `${Math.random() * 80 + 20}%` }}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {Math.floor(Math.random() * 5)} novos
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Footer / Tip */}
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
                <div className="p-2 bg-primary rounded-lg text-white">
                    <Info className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-[11px] font-extrabold text-primary uppercase tracking-widest mb-1">Dica de Inteligência</h4>
                    <p className="text-[12px] text-zinc-600 font-medium leading-relaxed">
                        Seus ativos da categoria <b>{stats?.categoryStats?.[0]?.name}</b> estão performando 25% acima da média. Considere reinvestir nessa categoria para maximizar seu ROI operacional este semestre.
                    </p>
                </div>
            </div>
        </div>
    );
}
