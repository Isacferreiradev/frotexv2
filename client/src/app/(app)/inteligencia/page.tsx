'use client';

import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Zap,
    CheckCircle,
    Calculator,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Package,
    ArrowRight,
    Wrench,
    Activity,
    Info
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useState } from 'react';

export default function InteligenciaPage() {
    const [search, setSearch] = useState('');

    const { data: insights, isLoading } = useQuery({
        queryKey: ['roi-insights'],
        queryFn: async () => (await api.get('/intelligence/roi')).data.data,
    });

    const filteredInsights = insights?.filter((i: any) =>
        i.toolName.toLowerCase().includes(search.toLowerCase()) ||
        i.categoryName.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        avgRoi: insights?.length ? (insights.reduce((acc: number, curr: any) => acc + curr.roi, 0) / insights.length).toFixed(1) : '0',
        criticalItems: insights?.filter((i: any) => i.suggestion.type === 'replace' || i.suggestion.type === 'alert').length || 0,
        avgUtilization: insights?.length ? (insights.reduce((acc: number, curr: any) => acc + curr.utilizationRate, 0) / insights.length).toFixed(0) : '0',
        adjustments: insights?.filter((i: any) => i.suggestion.type === 'increase' || i.suggestion.type === 'decrease').length || 0,
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700 py-10 px-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Inteligência & ROI</h1>
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap className="w-3 h-3 fill-violet-500" /> Algoritmo de Precificação Dinâmica
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-[20px] border border-violet-100 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar equipamento..."
                            className="pl-9 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-violet-100 w-64"
                        />
                    </div>
                    <button className="p-2.5 bg-zinc-50 text-zinc-400 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all border border-transparent hover:border-violet-100">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'ROI Médio Portfólio', value: `${stats.avgRoi}x`, sub: 'Retorno sobre investimento', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Itens de Atenção', value: stats.criticalItems, sub: 'Necessitam intervenção', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Uso da Frota', value: `${stats.avgUtilization}%`, sub: 'Taxa de ocupação média', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Sugestões de Preço', value: stats.adjustments, sub: 'Potencial de otimização', icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[28px] border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <div className="p-1 px-2.5 bg-zinc-50 rounded-full text-[8px] font-extrabold text-zinc-400 uppercase tracking-tight">Real-time</div>
                        </div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{s.label}</h4>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-extrabold text-zinc-900 tracking-tight">{s.value}</p>
                            <p className="text-[10px] font-medium text-zinc-400">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Insights Table */}
            <div className="bg-white rounded-[32px] border border-zinc-100 shadow-soft overflow-hidden">
                <div className="p-8 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/30">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-3">
                        <Calculator className="w-4 h-4 text-violet-600" /> Análise de Performance por Ativo
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Base de Dados Sincronizada</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50/50">
                                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Equipamento</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">ROI</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Utilização</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Financeiro</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sugestão de Preço</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>
                                ))
                            ) : filteredInsights?.map((item: any) => (
                                <tr key={item.toolId} className="group hover:bg-violet-50/30 transition-all cursor-default">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200 group-hover:bg-white group-hover:border-violet-200 transition-all">
                                                <Package className="w-5 h-5 text-zinc-400 group-hover:text-violet-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-900">{item.toolName}</p>
                                                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">{item.categoryName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className={cn(
                                                "text-sm font-extrabold tracking-tight",
                                                item.roi > 1 ? "text-emerald-600" : item.roi > 0.5 ? "text-violet-600" : "text-amber-600"
                                            )}>
                                                {item.roi.toFixed(1)}x
                                            </span>
                                            <div className="w-12 h-1 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-1000", item.roi > 1 ? "bg-emerald-500" : "bg-amber-400")}
                                                    style={{ width: `${Math.min(100, item.roiPercent)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                            <span className="text-[11px] font-bold text-zinc-700">{item.utilizationRate.toFixed(0)}%</span>
                                            <div className="flex items-center gap-1">
                                                {item.utilizationRate > 70 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-amber-500" />}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                <span className="text-zinc-900 font-bold">{formatCurrency(item.revenue)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                                                <Wrench className="w-3 h-3 text-amber-500" />
                                                <span>{formatCurrency(item.maintenanceCost)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className={cn(
                                            "flex items-center gap-3 p-2.5 rounded-2xl border transition-all",
                                            item.suggestion.type === 'increase' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                                item.suggestion.type === 'decrease' ? "bg-blue-50 border-blue-100 text-blue-700" :
                                                    item.suggestion.type === 'replace' ? "bg-red-50 border-red-100 text-red-700" :
                                                        "bg-zinc-50 border-zinc-100 text-zinc-600"
                                        )}>
                                            <div className="shrink-0 p-1.5 bg-white rounded-lg shadow-sm">
                                                {item.suggestion.type === 'increase' ? <ArrowUpRight className="w-3 h-3" /> :
                                                    item.suggestion.type === 'decrease' ? <ArrowDownRight className="w-3 h-3" /> :
                                                        <Calculator className="w-3 h-3" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase tracking-tight leading-none mb-1">{item.suggestion.text}</p>
                                                <p className="text-[9px] font-medium opacity-80 leading-tight">{item.suggestion.action}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-violet-600 transition-all shadow-premium group-hover:bg-violet-600">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer / Disclaimer */}
            <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 max-w-2xl">
                <Info className="w-5 h-5 text-zinc-400" />
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                    As sugestões de preço são baseadas em cálculos de ROI histórico e taxas de ocupação dos últimos 180 dias.
                    Recomendamos validar as condições do mercado local antes de aplicar reajustes automáticos.
                </p>
            </div>
        </div>
    );
}
