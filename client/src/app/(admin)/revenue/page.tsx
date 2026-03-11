'use client';

import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    CreditCard,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Download,
    Calendar,
    Zap,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminRevenuePage() {
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['admin-global-metrics'],
        queryFn: async () => (await api.get('/admin/metrics/overview')).data.data
    });

    const revenueStats = [
        { label: 'MRR (Mensal)', value: `R$ ${metrics?.revenue.mrrEstimado ?? '0'}`, icon: Target, trend: '+12.5%', trendUp: true, color: 'blue' },
        { label: 'ARR (Anual)', value: `R$ ${metrics?.revenue.arrEstimado ?? '0'}`, icon: TrendingUp, trend: '+8.2%', trendUp: true, color: 'indigo' },
        { label: 'Ticket Médio (ARPU)', value: `R$ ${metrics?.revenue.averageTicket ?? '0'}`, icon: PieChart, trend: '-2.1%', trendUp: false, color: 'emerald' },
        { label: 'Crescimento MoM', value: '14.2%', icon: BarChart3, trend: '+3.1%', trendUp: true, color: 'violet' },
    ];

    return (
        <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inteligência Financeira</h1>
                    <p className="text-slate-500 font-medium">Análise estratégica de receita, performance por plano e projeções de faturamento.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all">
                        <Calendar className="w-4 h-4" />
                        <span>Últimos 30 Dias</span>
                    </button>
                </div>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {revenueStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
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
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                                    {isLoading ? '...' : stat.value}
                                </h3>
                            </div>

                            <div className="absolute -right-2 -bottom-2 opacity-[0.03] text-slate-900">
                                <Icon className="w-24 h-24" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Breakdown & Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue by Plan */}
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                    <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-violet-500" /> Receita por Plano
                    </h3>

                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-2xl" />)}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span className="text-slate-600 uppercase tracking-tighter">Premium</span>
                                        </div>
                                        <span className="text-slate-900 font-black italic">R$ {metrics?.revenue.revenueByPlan.premium ?? '0'}</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: '65%' }} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                                            <span className="text-slate-600 uppercase tracking-tighter">Pro</span>
                                        </div>
                                        <span className="text-slate-900 font-black italic">R$ {metrics?.revenue.revenueByPlan.pro ?? '0'}</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500" style={{ width: '30%' }} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                                            <span className="text-slate-600 uppercase tracking-tighter">Free (Upsell Potential)</span>
                                        </div>
                                        <span className="text-slate-900 font-black italic">R$ 0</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-300" style={{ width: '5%' }} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-1">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">LTV Médio (Projetado)</p>
                            <p className="text-xl font-black text-emerald-700 tracking-tighter italic">R$ 2.450,00</p>
                        </div>
                    </div>
                </div>

                {/* Growth Funnel */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" /> Performance de Conversão & Churn
                        </h3>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">LTV:CAC ratio: 4.2x</span>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                            <TrendingUp className="w-12 h-12 opacity-20" />
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gráfico de Cohort & Churn Rate</p>
                                <p className="text-[10px] mt-1 font-medium italic italic">Dados em processamento... Disponível em 24h.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-8">
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Free-to-Paid</p>
                            <p className="text-lg font-black text-slate-800">12.4%</p>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                                <ArrowUpRight className="w-3 h-3" /> 2.1%
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Net Churn</p>
                            <p className="text-lg font-black text-slate-800">0.8%</p>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                                <ArrowDownRight className="w-3 h-3" /> 0.2%
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Churn Monetário</p>
                            <p className="text-lg font-black text-slate-800">R$ 450</p>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-red-400">
                                <ArrowUpRight className="w-3 h-3" /> R$ 120
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
