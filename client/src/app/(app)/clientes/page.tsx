'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users, ShieldAlert, Loader2, LayoutGrid, List, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CustomerForm } from '@/components/forms/CustomerForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { CustomerCard } from '@/components/shared/CustomerCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunicationTimeline } from '@/components/shared/CommunicationTimeline';
import { StatusPulse } from '@/components/shared/StatusPulse';


const BLOCKED_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'blocked', label: 'Bloqueados' },
];

export default function ClientesPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [search, setSearch] = useState('');
    const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customers');
            return res.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/customers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsCreateOpen(false);
            toast.success('Cliente cadastrado com sucesso!');
        },
        onError: () => toast.error('Erro ao cadastrar cliente'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.put(`/customers/${editingCustomer?.id || data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsSheetOpen(false);
            setEditingCustomer(null);
            toast.success('Dados atualizados com sucesso!');
        },
        onError: () => toast.error('Erro ao atualizar cliente'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente removido');
        },
        onError: () => toast.error('Erro ao remover cliente'),
    });

    const toggleBlockMutation = useMutation({
        mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) =>
            api.put(`/customers/${id}`, { isBlocked }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success(variables.isBlocked ? 'Cliente bloqueado' : 'Cliente desbloqueado');
        },
        onError: () => toast.error('Erro ao atualizar status'),
    });

    const filtered = (data || []).filter((c: any) => {
        const matchSearch = !search ||
            c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            c.documentNumber.includes(search) ||
            c.phoneNumber.includes(search);
        const matchFilter =
            blockedFilter === 'all' ||
            (blockedFilter === 'blocked' && c.isBlocked) ||
            (blockedFilter === 'active' && !c.isBlocked);
        return matchSearch && matchFilter;
    });

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 lg:space-y-12 animate-in fade-in duration-700 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Gestão de Relacionamento</h2>
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-3 h-3" /> Base Unificada de Clientes (CRM)
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-zinc-100 p-1 rounded-xl flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-white text-violet-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'table' ? "bg-white text-violet-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-violet-200">
                                <UserPlus className="w-4 h-4" />
                                Cadastrar Cliente
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] rounded-[32px] border-violet-50 p-0 overflow-hidden shadow-2xl">
                            <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                                <DialogTitle className="font-bold text-lg tracking-tight">Novo Cadastro de Cliente</DialogTitle>
                            </div>
                            <div className="p-8">
                                <CustomerForm
                                    onSubmit={(data) => createMutation.mutate(data)}
                                    isLoading={createMutation.isPending}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetContent className="sm:max-w-[600px] border-violet-50 p-0 overflow-hidden bg-white flex flex-col">
                            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-violet-50 bg-violet-50/20">
                                <SheetTitle className="font-bold text-2xl tracking-tight text-zinc-900">
                                    {editingCustomer?.fullName || 'Perfil do Cliente'}
                                </SheetTitle>
                                <SheetDescription className="text-violet-500 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de Dados & CRM</SheetDescription>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6">
                                <Tabs defaultValue="data" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-100/50 p-1.5 rounded-2xl">
                                        <TabsTrigger value="data" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-widest">
                                            Dados Básicos
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-widest">
                                            Interações
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="data" className="mt-0">
                                        <CustomerForm
                                            initialData={editingCustomer}
                                            onSubmit={(data) => updateMutation.mutate(data)}
                                            isLoading={updateMutation.isPending}
                                        />
                                    </TabsContent>
                                    <TabsContent value="history" className="mt-0">
                                        {editingCustomer?.id && (
                                            <CommunicationTimeline customerId={editingCustomer.id} />
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </SheetContent>
                    </Sheet>

                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full lg:w-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, documento ou telefone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-violet-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 placeholder:text-zinc-400 premium-shadow"
                    />
                </div>

                <div className="flex items-center gap-2 bg-zinc-100/50 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {BLOCKED_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setBlockedFilter(f.value as any)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                                blockedFilter === f.value
                                    ? "bg-white text-violet-600 shadow-sm border border-violet-50"
                                    : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array(8).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-[28px]" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Nenhum cliente encontrado"
                    description="Não encontramos registros para o filtro aplicado. Tente mudar sua busca."
                />
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((customer: any) => (
                        <CustomerCard
                            key={customer.id}
                            customer={customer}
                            onEdit={(c) => {
                                setEditingCustomer(c);
                                setIsSheetOpen(true);
                            }}
                            onToggleBlock={(id, isBlocked) => toggleBlockMutation.mutate({ id, isBlocked })}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-violet-50 premium-shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-violet-50 bg-violet-50/10">
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-violet-400 uppercase tracking-widest">Cliente</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-violet-400 uppercase tracking-widest">Identificação</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-violet-400 uppercase tracking-widest">Contato</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-violet-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-violet-400 uppercase tracking-widest">Gestão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-violet-50">
                                {filtered.map((customer: any) => (
                                    <tr
                                        key={customer.id}
                                        onClick={() => router.push(`/clientes/${customer.id}`)}
                                        className={cn(
                                            "group hover:bg-violet-50/20 transition-colors cursor-pointer",
                                            customer.isBlocked && "bg-red-50/10"
                                        )}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-violet-50 rounded-full flex items-center justify-center border border-violet-100 text-violet-600 font-bold text-[10px] group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                                    {customer.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900 text-sm group-hover:text-violet-600 transition-colors">{customer.fullName}</p>
                                                    <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-tight">{customer.email || 'SEM EMAIL'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{customer.documentType}</p>
                                            <p className="text-xs font-bold text-zinc-950 tabular-nums">{customer.documentNumber}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-zinc-900">{customer.phoneNumber}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <StatusPulse status={customer.isBlocked ? 'blocked' : 'active'} />
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest",
                                                    customer.isBlocked ? "text-red-500" : "text-emerald-600"
                                                )}>
                                                    {customer.isBlocked ? 'Bloqueado' : 'Ativo'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingCustomer(customer);
                                                        setIsSheetOpen(true);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-violet-50 text-zinc-400 hover:text-violet-600 hover:border-violet-200 hover:shadow-sm transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(`Excluir "${customer.fullName}"?`)) deleteMutation.mutate(customer.id); }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-violet-50 text-zinc-400 hover:text-red-500 hover:border-red-100 hover:shadow-sm transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
