'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Package, HardHat, Clock, Wallet, HandCoins, ShieldAlert,
    BarChart3, UserCheck, AlertTriangle, Zap, TrendingUp,
    Crown, ArrowUpRight, Percent, DollarSign, Activity, Wrench,
    Calendar, History, TrendingDown, LayoutDashboard, Target,
    Ghost, Skull, Info, Plus, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RentalDetailSheet } from '@/components/shared/RentalDetailSheet';

import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { memo, useState } from 'react';
import { motion } from 'framer-motion';

import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(() => import("@/components/dashboard/RevenueChart").then(mod => mod.RevenueChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-2xl" />
});

const ROIChart = dynamic(() => import("@/components/dashboard/ROIChart").then(mod => mod.ROIChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-2xl" />
});

// ─── Metric Card (Premium & Refined) ─────────────────────────────────────────
const MetricCard = memo(({
    title, value, icon: Icon, loading, variant = 'default', subtitle, onClick
}: {
    title: string;
    value: number | string;
    icon: any;
    loading?: boolean;
    variant?: 'default' | 'warning' | 'critical';
    subtitle?: string;
    onClick?: () => void;
}) => {
    const iconStyles = {
        default: "bg-primary text-white shadow-lg shadow-primary/20",
        warning: "bg-amber-500 text-white shadow-lg shadow-amber-100",
        critical: "bg-red-500 text-white shadow-lg shadow-red-100"
    };

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <Card
                glass
                onClick={onClick}
                className={cn(
                    "p-4 sm:p-5 lg:p-6 flex flex-col gap-3 group border-none relative overflow-hidden",
                    onClick && "cursor-pointer"
                )}
            >
                <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.25em]">{title}</span>
                    <motion.div
                        whileHover={{ rotate: 12, scale: 1.1 }}
                        className={cn(
                            "p-2.5 sm:p-3 rounded-2xl transition-all duration-500",
                            iconStyles[variant]
                        )}>
                        <Icon className="w-4 h-4" />
                    </motion.div>
                </div>

                <div className="flex flex-col gap-1 relative z-10">
                    {loading
                        ? <Skeleton className="h-8 w-3/4 rounded-lg" />
                        : <span className={cn(
                            'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight font-jakarta',
                            variant === 'critical' ? 'text-red-500' : 'text-foreground'
                        )}>{value}</span>
                    }
                    {subtitle && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {subtitle}
                        </span>
                    )}
                </div>

                <div className={cn(
                    "absolute bottom-0 left-4 right-4 sm:left-8 sm:right-8 h-1 rounded-t-full transition-all duration-500 opacity-0 group-hover:opacity-100 shadow-[0_0_12px_rgba(139,92,246,0.5)]",
                    variant === 'default' ? "bg-primary" : variant === 'warning' ? "bg-amber-500" : "bg-red-500"
                )} />
            </Card>
        </motion.div>
    );
});
MetricCard.displayName = 'MetricCard';

// ─── ROI Row ─────────────────────────────────────────────────────────────────
function ROIRow({ tool, rank, onClick }: { tool: any; rank: number; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 sm:gap-6 py-5 border-b border-border/50 last:border-0 group cursor-pointer"
        >
            <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all border border-transparent',
                rank === 0
                    ? 'bg-primary text-white shadow-premium scale-110'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10'
            )}>
                {rank === 0 ? <Crown className="w-5 h-5" /> : `${rank + 1}`}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate mb-2 group-hover:text-primary transition-colors font-jakarta">{tool.name}</p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(109,40,217,0.3)]"
                        style={{ width: `${Math.min(100, tool.roi)}%` }}
                    />
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-extrabold text-foreground font-jakarta">{formatCurrency(tool.netProfit)}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{tool.roi.toFixed(1)}% ROI</p>
            </div>
        </div>
    );
}

// ─── Billing Rule Widget ───────────────────────────────────
const BillingRuleWidget = ({ onOpenDetail }: { onOpenDetail: (rental: any) => void }) => {
    const { data: expiring, isLoading } = useQuery({
        queryKey: ['expiring-rentals'],
        queryFn: async () => (await api.get('/rentals/expiring')).data.data,
    });

    const sendWhatsApp = (rental: any) => {
        const phone = rental.customer.phoneNumber?.replace(/\D/g, '') || '';
        if (!phone) {
            alert('Cliente sem telefone cadastrado.');
            return;
        }
        const message = `Olá *${rental.customer.fullName}*! 🛠️\nNotamos que o aluguel do seu equipamento *${rental.tool.name}* vence em breve (${new Date(rental.endDateExpected).toLocaleDateString('pt-BR')}).\n\nDeseja renovar a locação ou solicitar a retirada?`;
        const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <Card glass className="md:col-span-1 xl:col-span-2 border-none h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-primary" />
                    <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Régua de Cobrança</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : expiring?.length > 0 ? (
                    expiring.map((rental: any) => (
                        <div key={rental.id} className="flex items-center justify-between p-4 bg-muted/5 rounded-xl border border-border/40 group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-primary/5 text-primary rounded-lg border border-primary/10">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div
                                    className="min-w-0 cursor-pointer flex-1"
                                    onClick={() => onOpenDetail(rental)}
                                >
                                    <p className="text-sm font-bold text-foreground truncate font-jakarta group-hover:text-primary transition-colors">{rental.customer.fullName}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                                        {rental.tool.name} • Vence {new Date(rental.endDateExpected).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => sendWhatsApp(rental)}
                                className="rounded-xl hover:bg-emerald-500 hover:text-white"
                            >
                                <Zap className="w-4 h-4" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="py-8 flex flex-col items-center justify-center bg-muted/5 rounded-2xl border border-dashed border-border">
                        <UserCheck className="w-8 h-8 text-muted-foreground/20 mb-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Tudo em dia</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('30d');
    const [detailRental, setDetailRental] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats', timeRange],
        queryFn: async () => (await api.get(`/rentals/dashboard-stats?period=${timeRange}`)).data.data,
        staleTime: 60_000,
    });

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = user?.fullName?.split(' ')[0] ?? '';
    const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

    return (
        <div className="space-y-6 sm:space-y-10 transition-all duration-500">
            {/* ── Welcome Header & Quick Filters ── */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 sm:gap-8">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground tracking-tight font-jakarta">
                        {greeting}, <span className="text-primary italic">{firstName}</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                        <p className="text-[9px] sm:text-[10px] font-extrabold text-primary uppercase tracking-[0.3em]">{today}</p>
                        <div className="hidden xs:block w-1 h-1 rounded-full bg-primary/20" />
                        <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Inteligência de Ativos v2.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 glass-v2 p-1 rounded-2xl border border-white/20 shadow-premium overflow-x-auto no-scrollbar">
                    {[
                        { id: 'today', label: 'Hoje' },
                        { id: '7d', label: '7 dias' },
                        { id: '30d', label: '30 dias' }
                    ].map((range) => (
                        <button
                            key={range.id}
                            onClick={() => setTimeRange(range.id as any)}
                            className={cn(
                                "px-4 sm:px-6 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap",
                                timeRange === range.id
                                    ? "bg-primary text-white shadow-premium scale-105"
                                    : "text-muted-foreground hover:bg-white/10"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <OnboardingChecklist />

            {/* ── Primary Analytics (Metric Cards) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard
                    title="Faturamento Bruto"
                    value={formatCurrency(stats?.revenueThisMonth ?? 0)}
                    icon={DollarSign}
                    loading={isLoading}
                    subtitle="Performance Financeira"
                />
                <MetricCard
                    title="Lucro Líquido"
                    value={formatCurrency(stats?.netProfit ?? 0)}
                    icon={TrendingUp}
                    loading={isLoading}
                    subtitle="Resultado Real (TCO)"
                />
                <MetricCard
                    title="Locações Ativas"
                    value={stats?.activeRentals ?? 0}
                    icon={Activity}
                    loading={isLoading}
                    subtitle="Volume Operacional"
                />
                <MetricCard
                    title="Atrasos Críticos"
                    value={stats?.overdueRentalsCount ?? 0}
                    icon={AlertTriangle}
                    loading={isLoading}
                    variant={stats?.overdueRentalsCount > 0 ? 'critical' : 'default'}
                    subtitle="Recuperação de Ativos"
                    onClick={() => router.push('/locacoes?status=active')}
                />
            </div>

            {/* ── Pro Intelligence & Pending Budgets ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card glass className="xl:col-span-2 border-none bg-zinc-900 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-all duration-700" />
                    <CardHeader className="flex flex-row items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <Crown className="w-5 h-5 text-primary" />
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Pro Fleet Intelligence</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-white">
                            Relatório Completo <ArrowUpRight className="ml-2 w-3 h-3" />
                        </Button>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10 py-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ROI MÉDIO REAL</p>
                            <p className="text-3xl sm:text-4xl font-extrabold font-jakarta text-emerald-400">
                                {stats?.total > 0 ? (stats.topToolsByROI?.reduce((sum: number, t: any) => sum + t.roi, 0) / stats.topToolsByROI?.length || 0).toFixed(1) : 0}%
                            </p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Contabilizando depreciação de 20%/ano e custos de manutenção.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capital em Risco</p>
                            <p className="text-4xl font-extrabold font-jakarta text-red-500">
                                {formatCurrency(stats?.zombieEquipment?.reduce((sum: number, t: any) => sum + parseFloat(t.acquisition || '0'), 0) || 0)}
                            </p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Investimento em equipamentos com ROI negativo ou fim de vida.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Saúde da Operação</p>
                            <div className="flex items-end gap-3 mb-2">
                                <p className="text-4xl font-extrabold font-jakarta text-white">
                                    {(stats?.occupancyRate || 0)}%
                                </p>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-1.5 ml-auto">Ocupação</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${stats?.occupancyRate}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card glass className="border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-primary" />
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Fluxo de Demanda</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-extrabold font-jakarta">{stats?.pendingQuotesCount || 0}</p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Orçamentos Pendentes</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-extrabold font-jakarta text-primary">{formatCurrency(stats?.potentialRevenue || 0)}</p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Potencial Bruto</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/orcamentos'}
                            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none text-[10px] font-extrabold uppercase tracking-widest py-6 rounded-2xl"
                        >
                            Ver Todos os Orçamentos
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ── Main Charts Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <RevenueChart data={stats?.revenueHistory ?? []} loading={isLoading} />
                <ROIChart data={stats?.categoryStats ?? []} loading={isLoading} />
            </div>

            {/* ── Secondary Insights ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ranking */}
                <Card glass className="lg:col-span-1 border-none">
                    <CardHeader>
                        <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Top 5 Rentabilidade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                            : stats?.topToolsByROI?.map((tool: any, i: number) => (
                                <ROIRow
                                    key={i}
                                    tool={tool}
                                    rank={i}
                                    onClick={() => router.push(`/ferramentas/${tool.id}`)}
                                />
                            ))
                        }
                    </CardContent>
                </Card>

                {/* Billing Rule */}
                <BillingRuleWidget onOpenDetail={(r) => {
                    setDetailRental(r);
                    setIsDetailOpen(true);
                }} />

                {/* Modified Health & Zombies Layout */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card glass className="md:col-span-1 bg-red-500/5 border-red-500/10 border-none">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-500">Equipamentos Zumbis</CardTitle>
                            <Skull className="w-4 h-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="space-y-3 pb-6">
                            {stats?.zombieEquipment?.length > 0 ? (
                                stats.zombieEquipment.slice(0, 3).map((tool: any) => (
                                    <div
                                        key={tool.id}
                                        onClick={() => router.push(`/ferramentas/${tool.id}`)}
                                        className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10 cursor-pointer hover:bg-red-500/10 transition-colors"
                                    >
                                        <p className="text-xs font-bold font-jakarta">{tool.name}</p>
                                        <span className="text-[9px] font-extrabold uppercase text-red-500 tracking-tight">Vender</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] font-bold text-muted-foreground uppercase text-center py-4">Frota Saudável</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card glass className="md:col-span-2 border-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all" />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Wrench className="w-4 h-4 text-primary" />
                                <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Saúde da Frota (Visão Geral)</CardTitle>
                            </div>
                            <Activity className="w-4 h-4 text-primary opacity-20" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 items-center py-4 lg:py-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl sm:text-4xl font-bold font-jakarta tracking-tight leading-none">
                                        {stats?.total > 0 ? (100 - (stats.maintenanceAlertsCount / stats.total * 100)).toFixed(0) : 100}%
                                    </span>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none pb-1">{stats?.maintenanceAlertsCount ?? 0} pendências</span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-primary shadow-[0_0_12px_rgba(109,40,217,0.4)] transition-all duration-1000"
                                        style={{ width: `${stats?.total > 0 ? (100 - (stats.maintenanceAlertsCount / stats.total * 100)) : 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 border-l border-zinc-100 pl-4 sm:pl-8 hidden xs:block">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Status Preditivo</p>
                                <p className="text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed truncate-2-lines">
                                    {stats?.maintenanceAlertsCount > 0
                                        ? `Existem ${stats.maintenanceAlertsCount} equipamentos que exigem atenção imediata.`
                                        : "Toda a sua frota está operando dentro dos parâmetros ideais."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <RentalDetailSheet
                rental={detailRental}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />
        </div>
    );
}
