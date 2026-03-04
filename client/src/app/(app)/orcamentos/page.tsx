'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Calculator, Trash2, Loader2, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_MAP: any = {
    draft: { label: 'Rascunho', color: 'bg-zinc-100 text-zinc-600' },
    sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-600' },
    accepted: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-600' },
    rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-600' },
};

export default function OrcamentosPage() {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<any>(null);

    const queryClient = useQueryClient();

    const { data: quotes, isLoading } = useQuery({
        queryKey: ['quotes'],
        queryFn: async () => (await api.get('/quotes')).data.data,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/quotes', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            setIsCreateOpen(false);
            toast.success('Orçamento/Reserva criado!');
        },
        onError: () => toast.error('Erro ao criar orçamento'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) =>
            api.put(`/quotes/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Status atualizado');
        },
    });

    const convertMutation = useMutation({
        mutationFn: (id: string) => api.post(`/quotes/${id}/convert`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            toast.success('Conversão realizada! Locação ativa.');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro na conversão'),
    });


    return (
        <div className="space-y-12 max-w-[1400px] mx-auto py-10 px-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">Orçamentos & Reservas</h1>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] flex items-center gap-2 mt-3">
                        <Calculator className="w-3.5 h-3.5" /> Funil de Conversão
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-[11px] uppercase tracking-widest transition-all shadow-premium">
                            <Plus className="w-4.5 h-4.5" />
                            Novo Orçamento
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-violet-50 p-0 overflow-hidden bg-white">
                        <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                            <DialogTitle className="font-bold text-xl tracking-tight text-zinc-900">Gerar Novo Orçamento</DialogTitle>
                        </div>
                        <div className="p-8">
                            <QuoteForm
                                onSubmit={(data) => createMutation.mutate(data)}
                                isLoading={createMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-border/40 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/10">
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Equipamento / Cliente</th>
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Período</th>
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Valor</th>
                                <th className="px-8 py-6 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="px-8 py-4"><Skeleton className="h-12 w-full" /></td></tr>
                                ))
                            ) : quotes?.length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center"><EmptyState icon={Calculator} title="Nenhum orçamento" description="Comece gerando um novo orçamento para seus clientes." /></td></tr>
                            ) : (
                                quotes.map((q: any) => (
                                    <tr key={q.id} className="group hover:bg-muted/30 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-zinc-900">{q.tool?.name}</span>
                                                <span className="text-[11px] text-zinc-500 font-medium">{q.customer?.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-700">
                                                    {format(new Date(q.startDate), 'dd/MM/yy')} → {format(new Date(q.endDateExpected), 'dd/MM/yy')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-violet-600">
                                            {formatCurrency(q.totalAmount)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border text-center w-fit",
                                                    STATUS_MAP[q.status].color
                                                )}>
                                                    {STATUS_MAP[q.status].label}
                                                </span>
                                                {/* Intelligence Badges */}
                                                <div className="flex gap-1">
                                                    {q.tool?.acquisitionCost && parseFloat(q.totalAmount) > (parseFloat(q.tool.acquisitionCost) * 0.1) && (
                                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase" title="Este aluguel representa mais de 10% do valor da máquina">
                                                            High ROI
                                                        </span>
                                                    )}
                                                    {q.tool?.status === 'maintenance' && (
                                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black uppercase">
                                                            Risco Manut.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {q.status === 'accepted' && (
                                                    <button
                                                        onClick={() => convertMutation.mutate(q.id)}
                                                        disabled={convertMutation.isPending}
                                                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-violet-200"
                                                        title="Converter em Locação"
                                                    >
                                                        {convertMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
                                                        Ativar Locação
                                                    </button>
                                                )}

                                                <button
                                                    className="p-2 bg-zinc-50 text-zinc-400 rounded-lg hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200"
                                                    title="Baixar PDF"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>

                                                <a
                                                    href={`https://wa.me/${q.customer?.phoneNumber?.replace(/\D/g, '')}?text=Olá ${q.customer?.fullName}, aqui está o orçamento para ${q.tool?.name}: ${formatCurrency(q.totalAmount)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-transparent hover:border-emerald-200"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
