'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, AlertTriangle, X, Loader2, LayoutGrid, List, History } from 'lucide-react';
import { Skeleton, SkeletonCard } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, cn, downloadFile } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { RentalCheckout } from '@/components/forms/RentalCheckout';
import { StatusPulse } from '@/components/shared/StatusPulse';
import { RentalCard } from '@/components/shared/RentalCard';
import { RentalDetailSheet } from '@/components/shared/RentalDetailSheet';

const RENTAL_STATUS = [
    { value: '', label: 'Histórico Completo' },
    { value: 'active', label: 'Em Andamento' },
    { value: 'returned', label: 'Finalizadas' },
    { value: 'cancelled', label: 'Canceladas' },
];

export default function LocacoesPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isReturnOpen, setIsReturnOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState<any>(null);
    const [detailRental, setDetailRental] = useState<any>(null);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['rentals', statusFilter],
        queryFn: async () => {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const res = await api.get(`/rentals${params}`);
            return res.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/rentals', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setIsCheckoutOpen(false);
            toast.success('Locação realizada com sucesso!');
        },
        onError: () => toast.error('Erro ao realizar locação'),
    });

    const returnMutation = useMutation({
        mutationFn: ({ id, date, method }: { id: string; date: string; method: string }) =>
            api.put(`/rentals/${id}/checkin`, { endDateActual: date, paymentMethod: method }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['finance-other-revenues'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setIsReturnOpen(false);
            setSelectedRental(null);
            toast.success('Equipamento devolvido com sucesso!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao processar devolução'),
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => api.put(`/rentals/${id}/cancel`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            toast.success('Locação cancelada');
        },
        onError: () => toast.error('Erro ao cancelar locação'),
    });

    const filtered = (data || []).filter((r: any) =>
        !search ||
        r.rentalCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.tool?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.customer?.fullName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-10 px-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">Controle Operacional</h1>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] flex items-center gap-2 mt-3">
                        <History className="w-3.5 h-3.5" /> Gestão de Fluxo de Locação
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-secondary/30 p-1.5 rounded-xl flex items-center gap-1 border border-primary/5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-200",
                                viewMode === 'grid' ? "bg-white text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-200",
                                viewMode === 'table' ? "bg-white text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                        <button
                            onClick={() => setIsCheckoutOpen(true)}
                            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-[11px] uppercase tracking-widest transition-all shadow-premium"
                        >
                            <Plus className="w-4.5 h-4.5" />
                            Nova Locação
                        </button>
                        <SheetContent className="sm:max-w-[700px] border-border/40 p-0 overflow-hidden bg-white shadow-float text-foreground">
                            <div className="px-10 py-10 border-b border-border/40 bg-muted/10">
                                <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Checkout de Item</SheetTitle>
                                <SheetDescription className="text-primary font-semibold text-[10px] uppercase tracking-[0.2em] mt-2">Saída de Equipamento Registrada</SheetDescription>
                            </div>
                            <div className="p-10">
                                <RentalCheckout
                                    onSubmit={(data) => createMutation.mutate(data)}
                                    isLoading={createMutation.isPending}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
                        <DialogContent className="sm:max-w-[480px] rounded-premium border-border/40 p-0 overflow-hidden shadow-float">
                            <div className="px-8 py-8 border-b border-border/40 bg-muted/10">
                                <DialogTitle className="font-semibold text-xl tracking-tight text-foreground">Efetuar Devolução</DialogTitle>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="space-y-5">
                                    <div className="p-6 bg-muted/30 rounded-2xl border border-border/40 flex justify-between items-center shadow-soft">
                                        <div>
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1.5 tracking-widest">Equipamento</p>
                                            <p className="text-[14px] font-semibold text-foreground tracking-tight">{selectedRental?.tool?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1.5 tracking-widest">Diária</p>
                                            <p className="text-[14px] font-semibold text-primary tabular-nums">{formatCurrency(selectedRental?.dailyRateAgreed || 0)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground ml-1">Data Real de Entrega</label>
                                        <input
                                            type="date"
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-muted/30 border-none rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground ml-1">Forma de Pagamento</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-muted/30 border-none rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
                                        >
                                            <option value="pix">PIX</option>
                                            <option value="cash">Dinheiro</option>
                                            <option value="credit_card">Cartão de Crédito</option>
                                            <option value="debit_card">Cartão de Débito</option>
                                            <option value="bank_transfer">Transferência Bancária</option>
                                        </select>
                                    </div>

                                    {/* Real-time Calculation with Intelligence Breakdown */}
                                    {selectedRental && (
                                        <div className="p-6 bg-zinc-900 rounded-3xl text-white space-y-4 shadow-premium border border-white/5 relative overflow-hidden">
                                            {/* Decorative Background Glow */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

                                            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] relative z-10">
                                                <span>Resumo do Período</span>
                                                <span className="text-white">
                                                    {(() => {
                                                        const start = new Date(selectedRental.startDate);
                                                        const end = new Date(returnDate);
                                                        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                                        return `${days} ${days === 1 ? 'Dia' : 'Dias'}`;
                                                    })()}
                                                </span>
                                            </div>

                                            <div className="space-y-2 relative z-10">
                                                <div className="flex justify-between text-[11px] font-medium text-zinc-400">
                                                    <span>Subtotal (Diárias)</span>
                                                    <span>
                                                        {(() => {
                                                            const start = new Date(selectedRental.startDate);
                                                            const actual = new Date(returnDate);
                                                            const totalDays = Math.max(1, Math.ceil((actual.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                                            const dailyRate = parseFloat(selectedRental.dailyRateAgreed || '0');
                                                            return formatCurrency(totalDays * dailyRate);
                                                        })()}
                                                    </span>
                                                </div>

                                                {(() => {
                                                    const actual = new Date(returnDate);
                                                    const expected = new Date(selectedRental.endDateExpected);
                                                    if (actual > expected) {
                                                        const start = new Date(selectedRental.startDate);
                                                        const totalDays = Math.max(1, Math.ceil((actual.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                                        const dailyRate = parseFloat(selectedRental.dailyRateAgreed || '0');
                                                        const subtotal = totalDays * dailyRate;
                                                        const fine = subtotal * 0.10; // 10% fine
                                                        return (
                                                            <div className="flex justify-between text-[11px] font-bold text-amber-400">
                                                                <span className="flex items-center gap-1.5 italic">
                                                                    <AlertTriangle className="w-3 h-3" /> Multa Atraso (10%)
                                                                </span>
                                                                <span>+{formatCurrency(fine)}</span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>

                                            <div className="h-[1px] bg-white/10 w-full relative z-10" />

                                            <div className="flex justify-between items-end relative z-10">
                                                <div>
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em] mb-1">Total Final</p>
                                                    <p className="text-xs text-zinc-500 font-medium">Cálculo Pro Intelligence</p>
                                                </div>
                                                <span className="text-3xl font-bold tracking-tighter tabular-nums text-white">
                                                    {(() => {
                                                        const start = new Date(selectedRental.startDate);
                                                        const actual = new Date(returnDate);
                                                        const expected = new Date(selectedRental.endDateExpected);
                                                        const totalDays = Math.max(1, Math.ceil((actual.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                                        const dailyRate = parseFloat(selectedRental.dailyRateAgreed || '0');
                                                        const subtotal = totalDays * dailyRate;
                                                        const fine = actual > expected ? subtotal * 0.10 : 0;
                                                        return formatCurrency(subtotal + fine);
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={() => setIsReturnOpen(false)}
                                        className="flex-1 px-5 py-3.5 rounded-xl border border-border/40 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:bg-muted/30 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={returnMutation.isPending}
                                        onClick={() => returnMutation.mutate({ id: selectedRental.id, date: returnDate, method: paymentMethod })}
                                        className="flex-1 px-5 py-3.5 rounded-xl bg-primary text-white text-[11px] font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-premium flex items-center justify-center gap-2"
                                    >
                                        {returnMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Retorno'}
                                    </button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-soft space-y-6">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisar por código, ferramenta ou cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/40 overflow-x-auto w-full lg:w-auto no-scrollbar">
                        {RENTAL_STATUS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                                    statusFilter === f.value
                                        ? "bg-white text-primary shadow-soft"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {Array(8).fill(0).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="mt-16">
                    <EmptyState
                        icon={FileText}
                        title="Nenhuma locação encontrada"
                        description="Não identificamos registros para este filtro. Revise sua busca."
                    />
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filtered.map((rental: any) => (
                        <RentalCard
                            key={rental.id}
                            rental={rental}
                            onReturn={(r) => {
                                setSelectedRental(r);
                                setIsReturnOpen(true);
                            }}
                            onCancel={(id) => { if (confirm('Cancelar esta locação?')) cancelMutation.mutate(id); }}
                            onDetail={(r) => {
                                setDetailRental(r);
                                setIsDetailOpen(true);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-border/40 shadow-soft overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/10">
                                    <th className="px-10 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Cód.</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Equipamento</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Cliente</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Prazo</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Status</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filtered.map((rental: any) => {
                                    const isOverdue = rental.status === 'active' && new Date(rental.endDateExpected) < new Date();
                                    return (
                                        <tr
                                            key={rental.id}
                                            onClick={() => {
                                                setDetailRental(rental);
                                                setIsDetailOpen(true);
                                            }}
                                            className="group hover:bg-muted/30 transition-all duration-300 cursor-pointer"
                                        >
                                            <td className="px-10 py-6">
                                                <span className="text-[10px] font-semibold text-primary tabular-nums bg-secondary/30 px-3 py-1.5 rounded-lg border border-primary/5 uppercase tracking-widest">
                                                    #{rental.rentalCode}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="font-semibold text-foreground text-[14px] tracking-tight group-hover:text-primary transition-colors">{rental.tool?.name}</p>
                                                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-tight mt-1">{rental.tool?.serialNumber}</p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="font-semibold text-foreground text-[14px] tracking-tight">{rental.customer?.fullName}</p>
                                                <p className="text-muted-foreground text-[10px] font-medium mt-1">{rental.customer?.phoneNumber}</p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[13px] font-semibold text-foreground tabular-nums tracking-tight">{formatDate(rental.startDate)}</span>
                                                    <span className={cn(
                                                        "text-[10px] font-medium uppercase tracking-tight",
                                                        isOverdue ? "text-red-500" : "text-muted-foreground"
                                                    )}>Até {formatDate(rental.endDateExpected)}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <StatusPulse status={isOverdue ? 'overdue' : rental.status} />
                                                    <span className={cn(
                                                        "text-[10px] font-semibold uppercase tracking-[0.2em] leading-none",
                                                        isOverdue ? "text-red-500" : rental.status === 'active' ? "text-emerald-600" : "text-muted-foreground"
                                                    )}>
                                                        {isOverdue ? 'Atrasada' : rental.status === 'active' ? 'Em campo' : 'Finalizada'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    {rental.status === 'active' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRental(rental);
                                                                    setReturnDate(new Date().toISOString().split('T')[0]);
                                                                    setIsReturnOpen(true);
                                                                }}
                                                                className="h-10 px-5 bg-primary text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-premium"
                                                            >
                                                                Devolver
                                                            </button>
                                                            <button
                                                                onClick={() => { if (confirm('Cancelar esta locação?')) cancelMutation.mutate(rental.id); }}
                                                                className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-border/40 text-muted-foreground hover:text-red-500 hover:border-red-100 hover:shadow-premium transition-all"
                                                                title="Cancelar"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <RentalDetailSheet
                rental={detailRental}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />
        </div>
    );
}
