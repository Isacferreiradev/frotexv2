'use client';

import {
    Users,
    Building2,
    CreditCard,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminDashboardPage() {
    // Fetch global stats from existing metrics endpoint
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['admin-global-overview'],
        queryFn: async () => (await api.get('/admin/metrics/overview')).data.data
    });

    const stats = [
        { label: 'Total de Empresas', value: metrics?.counts.tenants ?? '...', icon: Building2, trend: '+12%', trendUp: true, color: 'blue' },
        { label: 'Usuários Ativos', value: metrics?.counts.users ?? '...', icon: Users, trend: '+5%', trendUp: true, color: 'indigo' },
        { label: 'Locações Ativas', value: metrics?.counts.rentals ?? '...', icon: Activity, trend: '+18%', trendUp: true, color: 'emerald' },
        { label: 'MRR Estimado', value: `R$ ${metrics?.revenue.mrrEstimado ?? '0'}`, icon: CreditCard, trend: '+8%', trendUp: true, color: 'violet' },
    ];

    return (
        <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Master</h1>
                    <p className="text-slate-500 font-medium">Bem-vindo à Central de Comando. Aqui está a saúde global do Locattus.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filtros Global</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                        <span>Gerar Relatório Executivo</span>
                    </button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="flex items-start justify-between relative z-10">
                                <div className={cn(
                                    "p-3 rounded-2xl",
                                    stat.color === 'blue' && "bg-blue-50 text-blue-600",
                                    stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                                    stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                                    stat.color === 'violet' && "bg-violet-50 text-violet-600",
                                )}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg",
                                    stat.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                )}>
                                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.trend}
                                </div>
                            </div>

                            <div className="mt-6 relative z-10">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                                    {isLoading ? (
                                        <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg" />
                                    ) : stat.value}
                                </h3>
                            </div>

                            {/* Background decoration */}
                            <Icon className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
                        </div>
                    );
                })}
            </div>

            {/* Secondary Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-96 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-900 tracking-tight">Crescimento da Base</h3>
                            <p className="text-xs text-slate-500">Evolução de novos Tenants e Assinantes</p>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Activity className="w-8 h-8 opacity-20" />
                            <p className="text-[10px] font-bold tracking-widest uppercase opacity-40 italic">Gráfico em construção...</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 tracking-tight">Saúde das Contas</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-xl" />)}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-600 uppercase tracking-tighter">Assinaturas Ativas</span>
                                        <span className="text-emerald-600">{metrics?.accountStatus.active}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-600 uppercase tracking-tighter">Em Trial</span>
                                        <span className="text-blue-600">{metrics?.accountStatus.trialing}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-600 uppercase tracking-tighter">Inadimplentes (Past Due)</span>
                                        <span className="text-red-600">{metrics?.accountStatus.pastDue}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full" style={{ width: '12%' }} />
                                    </div>
                                </div>

                                <div className="space-y-2 text-center pt-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score de Saúde Global</p>
                                    <div className="text-4xl font-black text-emerald-600 tracking-tighter mt-1">94.2</div>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Excelente</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
