'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Calculator, Trash2, Loader2, ArrowRightLeft, FileText, CheckCircle2, Printer, Share2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuotePrintView } from '@/components/QuotePrintView';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FileSignature, Filter, Trash2 as TrashIcon } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'bg-zinc-100 text-zinc-600' },
    sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-600' },
    accepted: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-600' },
    rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-600' },
    converted: { label: 'Convertido', color: 'bg-violet-100 text-violet-600' },
};

const safeFormatDate = (dateStr: string | null | undefined) => {
    try {
        if (!dateStr) return '--/--/--';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '--/--/--';
        return format(date, 'dd/MM/yy');
    } catch {
        return '--/--/--';
    }
};

export default function OrcamentosPage() {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [previewQuote, setPreviewQuote] = useState<any>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
    });
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

    const convertMutation = useMutation({
        mutationFn: (id: string) => api.post(`/quotes/${id}/convert`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            toast.success('Conversão realizada! Locação ativa.');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro na conversão'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/quotes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Orçamento removido');
        },
        onError: () => toast.error('Erro ao remover orçamento'),
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
            </div >

            {/* Dashboard Stats */}
            < div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-1000 delay-200" >
                <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-soft">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Total em Aberto</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-zinc-900">
                            {formatCurrency(quotes?.filter((q: any) => q.status === 'sent' || q.status === 'draft').reduce((acc: number, q: any) => acc + parseFloat(q.totalAmount), 0) || 0)}
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-soft">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Taxa de Conversão</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-emerald-600">
                            {quotes?.length > 0
                                ? ((quotes.filter((q: any) => q.status === 'accepted' || q.status === 'converted').length / quotes.length) * 100).toFixed(0)
                                : 0}%
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-soft">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Enviados</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-blue-600">
                            {quotes?.filter((q: any) => q.status === 'sent').length || 0}
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-soft">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2">Ticket Médio</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-zinc-900">
                            {formatCurrency(quotes?.length > 0
                                ? quotes.reduce((acc: number, q: any) => acc + parseFloat(q.totalAmount), 0) / quotes.length
                                : 0)}
                        </span>
                    </div>
                </div>
            </div >

            {/* List */}
            <div className="mt-8">
                <DataTable
                    data={quotes || []}
                    isLoading={isLoading}
                    onSearchChange={(val) => setSearch(val)}
                    columns={[
                        {
                            header: "Itens / Cliente",
                            accessorKey: "quoteCode",
                            cell: (q: any) => (
                                <div className="flex flex-col gap-1">
                                    <div className="flex flex-wrap gap-1.5">
                                        {q.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-lg">
                                                <span className="font-bold text-[11px] text-zinc-900">{item.tool?.name}</span>
                                                <span className="text-[9px] text-primary font-bold">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-tight mt-1">Ref: {q.quoteCode} • {q.customer?.fullName}</span>
                                </div>
                            )
                        },
                        {
                            header: "Período",
                            accessorKey: "startDate",
                            cell: (q: any) => (
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-700">{safeFormatDate(q.startDate)} → {safeFormatDate(q.endDateExpected)}</span>
                                    <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mt-0.5">{q.rentalType || 'Diário'}</span>
                                </div>
                            )
                        },
                        {
                            header: "Investimento",
                            accessorKey: "totalAmount",
                            cell: (q: any) => (
                                <span className="font-extrabold text-violet-600 tracking-tight">
                                    {formatCurrency(q.totalAmount)}
                                </span>
                            )
                        },
                        {
                            header: "Status",
                            accessorKey: "status",
                            cell: (q: any) => (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-transparent shadow-sm whitespace-nowrap",
                                    STATUS_MAP[q.status]?.color || 'bg-zinc-100 text-zinc-600'
                                )}>
                                    {STATUS_MAP[q.status]?.label || q.status}
                                </span>
                            )
                        },
                        {
                            header: "Ações",
                            accessorKey: "id",
                            className: "text-right",
                            cell: (q: any) => (
                                <div className="flex items-center justify-end gap-2">
                                    {q.status === 'accepted' && (
                                        <Button
                                            onClick={() => convertMutation.mutate(q.id)}
                                            disabled={convertMutation.isPending}
                                            variant="default"
                                            size="xs"
                                            className="rounded-lg h-8 px-4 text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-violet-100"
                                        >
                                            {convertMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3 mr-2" />}
                                            Ativar
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="icon-xs"
                                        onClick={() => setPreviewQuote(q)}
                                        className="rounded-lg"
                                        title="Visualizar"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="icon-xs"
                                        onClick={() => window.open(`https://wa.me/${q.customer?.phone?.replace(/\D/g, '')}?text=Olá ${q.customer?.fullName}, segue o orçamento ${q.quoteCode}. Valor: ${formatCurrency(q.totalAmount)}`, '_blank')}
                                        className="rounded-lg hover:border-emerald-200 hover:text-emerald-600"
                                        title="Enviar WhatsApp"
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="icon-xs"
                                        onClick={() => {
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Excluir Orçamento',
                                                description: `Deseja excluir o orçamento ${q.quoteCode}? Esta ação não pode ser desfeita.`,
                                                onConfirm: () => {
                                                    deleteMutation.mutate(q.id);
                                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                }
                                            });
                                        }}
                                        className="rounded-lg hover:border-red-200 hover:text-red-500"
                                        title="Excluir"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )
                        }
                    ]}
                />
            </div >

            {/* Preview Modal */}
            <Dialog open={!!previewQuote} onOpenChange={() => setPreviewQuote(null)}>
                <DialogContent className="max-w-[850px] p-0 border-none bg-zinc-100/50 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-200 px-8 py-4 flex justify-between items-center">
                        <DialogTitle className="text-zinc-900 font-bold uppercase text-xs tracking-widest">Visualização Profissional</DialogTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full gap-2 text-[10px] font-bold uppercase tracking-widest px-4 border-zinc-200"
                                onClick={() => {
                                    const printContent = document.getElementById('quote-print-area');
                                    const windowUrl = window.open('', '', 'left=0,top=0,width=800,height=900');
                                    if (windowUrl && printContent) {
                                        windowUrl.document.write('<html><head><title>FROTEX Orçamento</title>');
                                        windowUrl.document.write('<script src="https://cdn.tailwindcss.com"></script>');
                                        windowUrl.document.write('</head><body>');
                                        windowUrl.document.write(printContent.innerHTML);
                                        windowUrl.document.write('</body></html>');
                                        windowUrl.document.close();
                                        windowUrl.focus();
                                        setTimeout(() => {
                                            windowUrl.print();
                                            windowUrl.close();
                                        }, 1000);
                                    }
                                }}
                            >
                                <Printer className="w-3.5 h-3.5" /> Imprimir
                            </Button>
                        </div>
                    </div>
                    <div className="p-8 flex justify-center pb-20">
                        <div className="shadow-2xl bg-white scale-90 origin-top rounded-sm overflow-hidden">
                            <QuotePrintView quote={previewQuote} tenant={null} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                isLoading={deleteMutation.isPending}
            />
        </div >
    );
}
