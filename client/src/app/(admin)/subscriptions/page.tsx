'use client';

import { useState } from 'react';
import {
    CreditCard,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    ChevronRight,
    ArrowUpRight,
    DollarSign,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminSubscriptionsPage() {
    const [page, setPage] = useState(1);
    const [planFilter, setPlanFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-subscriptions', page, planFilter, statusFilter],
        queryFn: async () => (await api.get('/admin/subscriptions', {
            params: { page, limit: 15, plan: planFilter, status: statusFilter }
        })).data
    });

    const subscriptions = response?.data || [];
    const meta = response?.meta || { total: 0, totalPages: 1 };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'active': return { label: 'Ativa', icon: CheckCircle2, class: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
            case 'trialing': return { label: 'Trial', icon: Clock, class: 'bg-blue-50 text-blue-700 border-blue-100' };
            case 'past_due': return { label: 'Atrasada', icon: AlertTriangle, class: 'bg-amber-50 text-amber-700 border-amber-100' };
            case 'canceled': return { label: 'Cancelada', icon: XCircle, class: 'bg-red-50 text-red-700 border-red-100' };
            default: return { label: status, icon: Clock, class: 'bg-slate-50 text-slate-500 border-slate-100' };
        }
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Monitoramento de Assinaturas</h1>
                    <p className="text-sm text-slate-500 font-medium">Gestão de planos, ciclos de faturamento e saúde financeira dos clientes.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Status</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[11px] font-bold text-slate-700 leading-none">Healthy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 ml-2" />
                    <select
                        className="text-xs bg-slate-50 border-slate-100 rounded-lg py-1.5 px-3 font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10"
                        value={planFilter}
                        onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">Filtrar: Todos os Planos</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                    </select>
                    <select
                        className="text-xs bg-slate-50 border-slate-100 rounded-lg py-1.5 px-3 font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">Filtrar: Todos os Status</option>
                        <option value="active">Ativo</option>
                        <option value="trialing">Trial</option>
                        <option value="past_due">Em Atraso</option>
                        <option value="canceled">Cancelado</option>
                    </select>
                </div>

                <div className="ml-auto text-xs text-slate-400 font-medium italic">
                    {meta.total} registros encontrados
                </div>
            </div>

            {/* Subscriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-white border border-slate-200 rounded-3xl animate-pulse" />)
                ) : subscriptions.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 italic bg-white border border-slate-200 rounded-3xl">Nenhuma assinatura encontrada.</div>
                ) : subscriptions.map((sub: any) => {
                    const status = getStatusInfo(sub.subscriptionStatus);
                    const StatusIcon = status.icon;

                    return (
                        <div key={sub.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{sub.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                                    sub.plan === 'premium' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' :
                                                        sub.plan === 'pro' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                                            'bg-slate-50 text-slate-500 border-slate-200'
                                                )}>
                                                    PLANO {sub.plan}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", status.class)}>
                                        <StatusIcon className="w-3 h-3" /> {status.label}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Início do Ciclo</p>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                            {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Próxima Fatura / Trial</p>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                                            {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString('pt-BR') :
                                                sub.subscriptionEndsAt ? new Date(sub.subscriptionEndsAt).toLocaleDateString('pt-BR') :
                                                    'Ciclo Contínuo'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs font-black text-slate-900 tracking-tight">R$ {sub.plan === 'premium' ? '199,00' : sub.plan === 'pro' ? '99,00' : '0,00'}/mês</span>
                                </div>
                                <Link
                                    href={`/admin/tenants/${sub.id}`}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 transition-all group-hover:translate-x-1"
                                >
                                    Gerenciar <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Anterior
                    </button>
                    <span className="text-xs font-bold text-slate-400 px-4">Página {page} de {meta.totalPages}</span>
                    <button
                        disabled={page >= meta.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
}
