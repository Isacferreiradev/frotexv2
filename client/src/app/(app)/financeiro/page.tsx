'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Plus,
    Wallet,
    ExternalLink,
    Search,
    Filter,
    ArrowRight,
    TrendingUp
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FinanceiroPage() {
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['finance-stats'],
        queryFn: async () => (await api.get('/finance/stats')).data.data,
    });

    const { data: expensesList, isLoading: expensesLoading } = useQuery({
        queryKey: ['finance-expenses'],
        queryFn: async () => (await api.get('/finance/expenses')).data.data,
    });

    const { data: otherRevenuesList, isLoading: otherRevenuesLoading } = useQuery({
        queryKey: ['finance-other-revenues'],
        queryFn: async () => (await api.get('/finance/other-revenues')).data.data,
    });

    const expenseMutation = useMutation({
        mutationFn: async (data: any) => await api.post('/finance/expenses', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
            setIsExpenseModalOpen(false);
            toast.success('Despesa registrada com sucesso');
        }
    });

    const revenueMutation = useMutation({
        mutationFn: async (data: any) => await api.post('/finance/other-revenues', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            queryClient.invalidateQueries({ queryKey: ['finance-other-revenues'] });
            setIsRevenueModalOpen(false);
            toast.success('Receita registrada com sucesso');
        }
    });

    const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        expenseMutation.mutate({
            category: formData.get('category'),
            description: formData.get('description'),
            amount: formData.get('amount'),
            date: new Date().toISOString(),
        });
    };

    const handleAddRevenue = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        revenueMutation.mutate({
            category: formData.get('category'),
            description: formData.get('description'),
            amount: formData.get('amount'),
            date: new Date().toISOString(),
        });
    };

    // Unified Transactions — only completed payments
    const transactions = [
        ...(stats?.recentPayments?.map((p: any) => ({
            id: p.id,
            type: 'receita_locacao',
            category: 'Locação',
            description: `Locação #${p.rental?.rentalCode || '—'}`,
            amount: parseFloat(p.amount),
            date: p.paymentDate,
            status: p.status,
            method: p.paymentMethod,
        })) || []),
        ...(expensesList?.map((e: any) => ({
            id: e.id,
            type: 'despesa',
            category: e.category,
            description: e.description,
            amount: -parseFloat(e.amount),
            date: e.date,
            status: 'completed',
            method: 'manual',
        })) || []),
        ...(otherRevenuesList?.map((r: any) => ({
            id: r.id,
            type: 'receita_extra',
            category: r.category,
            description: r.description,
            amount: parseFloat(r.amount),
            date: r.date,
            status: 'completed',
            method: 'manual',
        })) || []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

    if (statsLoading || expensesLoading || otherRevenuesLoading) {
        return <div className="p-8 space-y-4">
            <div className="h-32 bg-zinc-100 rounded-3xl animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-zinc-50 rounded-3xl animate-pulse" />)}
            </div>
        </div>;
    }

    const cards = [
        {
            label: 'Receita Total',
            value: stats?.revenue || '0',
            icon: ArrowUpRight,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Despesas Gerais',
            value: stats?.expenses || '0',
            icon: ArrowDownRight,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        },
        {
            label: 'Lucro Líquido',
            value: stats?.netProfit || '0',
            icon: TrendingUp,
            color: 'text-violet-600',
            bg: 'bg-violet-50'
        },
        {
            label: 'A Receber (Aluguéis)',
            value: stats?.pending || '0',
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
    ];

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 lg:space-y-12 animate-in fade-in duration-700 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Financeiro Elite</h1>
                    <p className="text-zinc-500 font-medium">Fluxo de caixa unificado: Locações, Vendas e Operação.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsRevenueModalOpen(true)}
                        className="h-12 px-6 bg-emerald-600 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        <Plus className="w-4 h-4" /> Nova Receita
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="h-12 px-6 bg-white border border-zinc-200 text-zinc-700 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nova Despesa
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="group bg-white p-7 rounded-[32px] border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-100 transition-all duration-500">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Este Período</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                            <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
                                {formatCurrency(parseFloat(card.value))}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Transactions Table */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden mb-8">
                    <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900">Fluxo de Caixa</h3>
                            <p className="text-xs text-zinc-500 mt-1">Visão unificada de todas as entradas e saídas.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-zinc-100 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50/50">
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Descrição</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Data</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Valor</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="group hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                                                    tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                )}>
                                                    {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-zinc-900 block">{tx.description}</span>
                                                    <span className="text-[10px] text-zinc-400 font-medium uppercase">{tx.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-medium text-zinc-500">{formatDate(tx.date)}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "text-sm font-bold",
                                                tx.amount > 0 ? "text-zinc-900" : "text-rose-600"
                                            )}>
                                                {formatCurrency(Math.abs(tx.amount))}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.status === 'completed' || tx.status === 'received' ? 'bg-emerald-50 text-emerald-600' :
                                                tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-950 transition-colors">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold">Resumo Estratégico</h3>
                                <p className="text-zinc-400 text-xs">Ponto de ruptura e margem operacional.</p>
                            </div>
                            <div className="pt-4 space-y-4 border-t border-white/10">
                                <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                                    <span>Divisão de Receita</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Locações</span>
                                        <span>{formatCurrency(parseFloat(stats?.rentalRevenue || '0'))}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>Extras/Vendas</span>
                                        <span>{formatCurrency(parseFloat(stats?.otherRevenue || '0'))}</span>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-between items-center border-t border-white/10">
                                    <span className="text-sm text-zinc-400">Margem Líquida</span>
                                    <span className="text-sm font-bold text-emerald-400">
                                        {(() => {
                                            const rev = parseFloat(stats?.revenue || '0');
                                            const exp = parseFloat(stats?.expenses || '0');
                                            if (rev === 0) return '—';
                                            const margin = ((rev - exp) / rev) * 100;
                                            return `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`;
                                        })()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-2xl font-bold">
                                    <span>Saldo</span>
                                    <span>{formatCurrency(parseFloat(stats?.netProfit || '0'))}</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-violet-600/20 blur-[60px] rounded-full" />
                    </div>

                    <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Metas do Mês
                        </h3>
                        <div className="space-y-4">
                            {(() => {
                                const revenue = parseFloat(stats?.revenue || '0');
                                const goal = 15000; // Placeholder goal, could be from tenant settings
                                const progress = Math.min(100, (revenue / goal) * 100);
                                return (
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase mb-2">
                                            <span>Faturamento Mensal</span>
                                            <span>{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-2 font-medium">Meta: {formatCurrency(goal)}</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Modal */}
            <Sheet open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <SheetContent className="sm:max-w-[450px] p-6 md:p-12 rounded-l-[40px]">
                    <SheetHeader className="mb-8">
                        <SheetTitle className="text-3xl font-bold">Nova Despesa</SheetTitle>
                        <SheetDescription>Registre custos operacionais (Aluguel, Luz, Manutenção).</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleAddExpense} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <select
                                name="category"
                                className="w-full h-12 px-4 rounded-xl border border-zinc-100 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-100 text-sm font-medium"
                                required
                            >
                                <option value="operational">Operacional (Aluguel/Luz)</option>
                                <option value="maintenance">Manutenção</option>
                                <option value="acquisition">Aquisição de Patrimônio</option>
                                <option value="marketing">Marketing</option>
                                <option value="other">Outros</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input name="description" placeholder="Ex: Aluguel Fevereiro" required className="h-12 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$)</Label>
                            <Input name="amount" type="number" step="0.01" placeholder="0.00" required className="h-12 rounded-xl" />
                        </div>

                        <div className="pt-6 flex gap-4">
                            <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
                            <Button type="submit" disabled={expenseMutation.isPending} className="flex-1 h-12 rounded-xl bg-zinc-900">{expenseMutation.isPending ? 'Salvando...' : 'Salvar Despesa'}</Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Revenue Modal */}
            <Sheet open={isRevenueModalOpen} onOpenChange={setIsRevenueModalOpen}>
                <SheetContent className="sm:max-w-[450px] p-6 md:p-12 rounded-l-[40px]">
                    <SheetHeader className="mb-8">
                        <SheetTitle className="text-3xl font-bold text-emerald-600">Nova Receita</SheetTitle>
                        <SheetDescription>Registre entradas extras (Venda de acessórios, serviços).</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleAddRevenue} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <select
                                name="category"
                                className="w-full h-12 px-4 rounded-xl border border-zinc-100 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm font-medium"
                                required
                            >
                                <option value="accessories">Venda de Acessórios</option>
                                <option value="service">Serviços / Consultoria</option>
                                <option value="sale">Venda de Equipamento (Seminovo)</option>
                                <option value="other">Outros</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input name="description" placeholder="Ex: Venda de Disco de Corte" required className="h-12 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$)</Label>
                            <Input name="amount" type="number" step="0.01" placeholder="0.00" required className="h-12 rounded-xl" />
                        </div>

                        <div className="pt-6 flex gap-4">
                            <Button type="button" variant="outline" onClick={() => setIsRevenueModalOpen(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
                            <Button type="submit" disabled={revenueMutation.isPending} className="flex-1 h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">{revenueMutation.isPending ? 'Salvando...' : 'Salvar Receita'}</Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
