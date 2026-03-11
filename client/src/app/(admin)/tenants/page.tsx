'use client';

import { useState } from 'react';
import {
    Search,
    Filter,
    MoreHorizontal,
    Building2,
    ChevronRight,
    BadgeAlert,
    TrendingUp,
    ShieldAlert,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminTenantsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [plan, setPlan] = useState('');
    const [status, setStatus] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-tenants', page, search, plan, status],
        queryFn: async () => (await api.get('/admin/tenants', {
            params: { page, limit: 15, search, plan, status }
        })).data
    });

    const tenants = response?.data || [];
    const meta = response?.meta || { total: 0, totalPages: 1 };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-tighter"><CheckCircle2 className="w-3 h-3" /> Ativo</span>;
            case 'trialing': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-tighter"><Clock className="w-3 h-3" /> Trial</span>;
            case 'past_due': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-100 uppercase tracking-tighter"><BadgeAlert className="w-3 h-3" /> Atrasado</span>;
            case 'canceled': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-tighter"><XCircle className="w-3 h-3" /> Cancelado</span>;
            default: return <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold border border-slate-100 uppercase tracking-tighter">{status}</span>;
        }
    };

    const getPlanBadge = (plan: string) => {
        const colors: any = {
            free: 'bg-slate-100 text-slate-600 border-slate-200',
            pro: 'bg-violet-50 text-violet-700 border-violet-100',
            premium: 'bg-amber-50 text-amber-700 border-amber-100'
        };
        return <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", colors[plan] || 'bg-slate-100 text-slate-600 border-slate-200')}>{plan}</span>;
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Empresas</h1>
                    <p className="text-sm text-slate-500 font-medium">Controle total sobre a base de locadoras e assinantes do SaaS.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CNPJ ou email..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Filtrar:</span>
                    <select
                        className="text-xs bg-slate-50 border-slate-100 rounded-lg py-1.5 px-3 font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10"
                        value={plan}
                        onChange={(e) => { setPlan(e.target.value); setPage(1); }}
                    >
                        <option value="">Todos os Planos</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                    </select>
                    <select
                        className="text-xs bg-slate-50 border-slate-100 rounded-lg py-1.5 px-3 font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10"
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    >
                        <option value="">Todos os Status</option>
                        <option value="active">Ativo</option>
                        <option value="trialing">Trial</option>
                        <option value="past_due">Atrasado</option>
                        <option value="canceled">Cancelado</option>
                    </select>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <p className="text-xs text-slate-400 font-medium italic">Mostrando {tenants.length} de {meta.total} empresas</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-separate">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano & Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uso do Produto</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Insights</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-50 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Nenhuma empresa encontrada com estes filtros.</td>
                                </tr>
                            ) : tenants.map((tenant: any) => (
                                <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-tight">{tenant.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{tenant.cnpj || 'Sem CNPJ'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                {getPlanBadge(tenant.plan)}
                                                {getStatusBadge(tenant.subscriptionStatus)}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Desde {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Equipamentos</p>
                                                <p className="text-xs font-bold text-slate-700">{tenant.stats?.toolsCount ?? 0}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Clientes</p>
                                                <p className="text-xs font-bold text-slate-700">{tenant.stats?.customersCount ?? 0}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Aluguéis</p>
                                                <p className="text-xs font-bold text-slate-700">{tenant.stats?.rentalsCount ?? 0}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {tenant.insights?.churnRisk && (
                                                <span className="p-1.5 bg-red-50 text-red-500 rounded-lg border border-red-100" title="Risco de Churn Elevado">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                            {tenant.insights?.upgradePotential && (
                                                <span className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg border border-emerald-100" title="Potencial de Upgrade">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                            {tenant.hasOnboarded ? (
                                                <span className="p-1.5 bg-blue-50 text-blue-500 rounded-lg border border-blue-100" title="Onboarding Completo">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </span>
                                            ) : (
                                                <span className="p-1.5 bg-slate-50 text-slate-300 rounded-lg border border-slate-100" title="Onboarding Pendente">
                                                    <Clock className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/tenants/${tenant.id}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                        >
                                            Ver Detalhes <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">
                        Página {meta.page} de {meta.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Anterior
                        </button>
                        <button
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
