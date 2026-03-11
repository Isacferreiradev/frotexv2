'use client';

import { use, useState } from 'react';
import {
    Building2,
    Users,
    Wrench,
    FileText,
    CreditCard,
    Calendar,
    MapPin,
    Phone,
    Mail,
    ShieldAlert,
    Lock,
    Unlock,
    RefreshCw,
    Trash2,
    ChevronLeft,
    CheckCircle2,
    AlertTriangle,
    Clock,
    TrendingUp,
    Zap,
    Activity,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isUpdating, setIsUpdating] = useState(false);

    const { data: tenant, isLoading } = useQuery({
        queryKey: ['admin-tenant', id],
        queryFn: async () => (await api.get(`/admin/tenants/${id}`)).data.data
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => (await api.put(`/admin/tenants/${id}`, payload)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
            setIsUpdating(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => (await api.delete(`/admin/tenants/${id}`)).data,
        onSuccess: () => {
            router.push('/admin/tenants');
        }
    });

    if (isLoading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando perfil 360º...</p>
            </div>
        );
    }

    if (!tenant) return <div className="p-10 text-center font-bold text-slate-500 italic">Tenant não encontrado.</div>;

    const handleToggleLock = () => {
        const isLocked = tenant.isManualLock;
        const reason = isLocked ? null : window.prompt('Motivo do bloqueio:', 'Violação de termos de uso / Inadimplência extra-judicial');

        if (!isLocked && reason === null) return;

        updateMutation.mutate({
            isManualLock: !isLocked,
            lockReason: reason
        });
    };

    const handleChangePlan = () => {
        const newPlan = window.prompt('Novo plano (free, pro, premium):', tenant.plan);
        if (newPlan && ['free', 'pro', 'premium'].includes(newPlan)) {
            updateMutation.mutate({ plan: newPlan });
        }
    };

    const handleDelete = () => {
        if (window.confirm('PERIGO: Isso apagará TODOS os dados desta empresa (usuários, aluguéis, equipamentos). Esta ação é irreversível. Confirmar?')) {
            deleteMutation.mutate();
        }
    };

    const stats = [
        { label: 'Usuários', value: tenant.stats?.usersCount ?? 0, icon: Users, color: 'blue' },
        { label: 'Equipamentos', value: tenant.stats?.toolsCount ?? 0, icon: Wrench, color: 'indigo' },
        { label: 'Clientes', value: tenant.stats?.customersCount ?? 0, icon: Users, color: 'emerald' },
        { label: 'Aluguéis', value: tenant.stats?.rentalsCount ?? 0, icon: FileText, color: 'violet' },
    ];

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto pb-20">
            {/* Breadcrumb & Global Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                    href="/admin/tenants"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                >
                    <ChevronLeft className="w-4 h-4" /> Voltar para lista
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleLock}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
                            tenant.isManualLock
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                                : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100"
                        )}
                    >
                        {tenant.isManualLock ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{tenant.isManualLock ? 'Desbloquear Acesso' : 'Bloquear Empresa'}</span>
                    </button>

                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Permanentemente</span>
                    </button>
                </div>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-separate">
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                            <Building2 className="w-10 h-10 text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight">{tenant.name}</h1>
                                {tenant.isManualLock && (
                                    <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">Bloqueado</span>
                                )}
                            </div>
                            <p className="text-slate-400 font-medium flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">CNPJ:</span> {tenant.cnpj || 'Não informado'}
                                <span className="mx-2 opacity-30">•</span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">ID:</span> {tenant.id}
                            </p>
                        </div>

                        <div className="md:ml-auto flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400/30">Plano {tenant.plan}</span>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    tenant.subscriptionStatus === 'active' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                )}>{tenant.subscriptionStatus}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Desde {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                <div className={cn(
                                    "p-2.5 rounded-xl",
                                    stat.color === 'blue' && "bg-blue-50 text-blue-600",
                                    stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                                    stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                                    stat.color === 'violet' && "bg-violet-50 text-violet-600",
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xl font-black text-slate-900 leading-none mt-1">{stat.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Registration Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" /> Detalhes Cadastrais
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Localização</p>
                                    <p className="text-xs font-semibold text-slate-700">{tenant.city} - {tenant.state}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</p>
                                    <p className="text-xs font-semibold text-slate-700">{tenant.phoneNumber || 'Não informado'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status de Automação</p>
                                    <p className="text-xs font-semibold text-slate-700">{tenant.hasOnboarded ? 'Onboarding Concluído' : 'Aguardando Onboarding'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ações Operacionais</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={handleChangePlan}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl border border-slate-200 transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Alterar Plano SaaS
                                    </div>
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => updateMutation.mutate({ hasOnboarded: false })}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl border border-slate-200 transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Reiniciar Tour/Onboarding
                                    </div>
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Alert Card if Locked */}
                    {tenant.isManualLock && (
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-200 shadow-lg shadow-red-500/5 space-y-3">
                            <div className="flex items-center gap-3 text-red-600">
                                <ShieldAlert className="w-6 h-6" />
                                <h4 className="font-black uppercase tracking-widest text-xs">Acesso Bloqueado</h4>
                            </div>
                            <p className="text-sm text-red-700 font-medium leading-relaxed italic">
                                "{tenant.lockReason || 'Bloqueio administrativo realizado sem motivo detalhado.'}"
                            </p>
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">O usuário verá uma tela de bloqueio ao tentar logar.</p>
                        </div>
                    )}
                </div>

                {/* Right: Insights & Usage Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> Insights & Monitaração do Produto
                            </h3>
                            <div className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Tempo Real</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Sinais de Risco (Churn)
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-500">Inatividade (15 dias)</span>
                                            <span className="text-slate-400">Não constatado</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-500">Uso de Ferramentas</span>
                                            <span className="text-emerald-500">Saudável</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-500">Status de Pagamento</span>
                                            <span className={cn(tenant.subscriptionStatus === 'active' ? "text-emerald-500" : "text-amber-500")}>
                                                {tenant.subscriptionStatus === 'active' ? 'Em dia' : 'Revisar fatura'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100 space-y-4">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3" /> Potencial de Expansão
                                    </h4>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        O cliente está utilizando **{tenant.stats?.rentalsCount || 0} de 10** aluguéis ativos no plano atual.
                                        {(tenant.stats?.rentalsCount || 0) > 7 ? ' Próximo ao limite - Oportunidade de Upgrade!' : ' Uso moderado.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center items-center text-center p-8 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gráfico de Retenção</h4>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium italic italic">Em breve: Mapa de calor de sessões e engajamento.</p>
                            </div>
                        </div>
                    </div>

                    {/* Billing History (AbacatePay) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-violet-500" /> Histórico Financeiro (AbacatePay)
                            </h3>
                            <Link href="/admin/revenue" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                Ver todos <TrendingUp className="w-3 h-3" />
                            </Link>
                        </div>

                        {!tenant.billingCharges || tenant.billingCharges.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma cobrança gerada</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tenant.billingCharges.map((charge: any) => (
                                    <div key={charge.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold",
                                                charge.status === 'paid' ? "bg-emerald-100 text-emerald-600" :
                                                    charge.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                                            )}>
                                                {charge.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> :
                                                    charge.status === 'pending' ? <Clock className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-800 leading-none">R$ {parseFloat(charge.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                    <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase">{charge.planRequested}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tighter">
                                                    {new Date(charge.createdAt).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                charge.status === 'paid' ? "bg-emerald-500 text-white" :
                                                    charge.status === 'pending' ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                                            )}>
                                                {charge.status === 'paid' ? 'Pago' : charge.status === 'pending' ? 'Pendente' : charge.status.toUpperCase()}
                                            </span>
                                            {charge.devMode && <p className="text-[8px] font-bold text-amber-500 mt-1 uppercase">Modo Teste</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Placeholder for linked entities */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-6">Usuários Vinculados</h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px]">
                                        OP
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 leading-none">Usuário Admin da Empresa</p>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tighter">Acesso Proprietário</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Perfil</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
